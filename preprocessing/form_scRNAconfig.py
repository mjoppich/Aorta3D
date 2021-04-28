import os
import json
import h5py
import argparse
import numpy as np
import pandas as pd
import scanpy as sc
import matplotlib.pyplot as plt
from matplotlib.backends.backend_agg import FigureCanvas

future_main_path = '/usr/local/hdd/rita/hiwi/Aorta3D/server/'
config_path = '/usr/local/hdd/rita/hiwi/Aorta3D/server/configs/'

def celltype(data, leiden):
    group2cellname = {"0": "Monocytes;Immune system","1": "Dendritic cells;Immune system","2": "NK cells;Immune system","3": "Macrophages;Immune system","4": "Dendritic cells;Immune system","5": "Macrophages;Immune system","6": "Macrophages;Immune system","7": "Mast cells;Immune system","8": "NK cells;Immune system","9": "Mast cells;Immune system","10": "Mast cells;Immune system","11": "Dendritic cells;Immune system","12": "Monocytes;Immune system","13": "Plasma cells;Immune system","14": "NK cells;Immune system","15": "Plasma cells;Immune system","16": "Airway goblet cells;Lungs","17": "Plasma cells;Immune system","18": "B cells;Immune system","19": "Gamma delta T cells;Immune system","20": "B cells;Immune system","21": "Macrophages;Immune system","22": "Gamma delta T cells;Immune system","23": "Plasma cells;Immune system","24": "Macrophages;Immune system","25": "T cells;Immune system","26": "Plasma cells;Immune system"}  
    group_name = leiden
    data.obs['new_clusters'] = (
        data.obs[group_name]
        .map(group2cellname)
        .astype('category')
    )
    types = np.unique(list(group2cellname.values()))
    return types, group2cellname

def umap(data, group2cellname, leiden_dict, coord_tuple, clusters, leiden, expr_path, output_dir, figure_pix_size=200):
    my_dpi=100

    fig = plt.figure(figsize=(figure_pix_size/my_dpi, figure_pix_size/my_dpi), dpi=my_dpi)
    canvas = FigureCanvas(fig)
    ax = plt.Axes(fig, [0., 0., 1., 1.])
    ax.set_axis_off()
    fig.add_axes(ax)

    #Plot clustering
    color_map = dict(zip(range(len(clusters)), data.uns[str(leiden) + '_colors']))
    im = plt.scatter([x[0] for x in coord_tuple], [x[1] for x in coord_tuple], c='white', s=0.1)
    for i in np.unique(clusters):
        selected = [k for k,v in leiden_dict.items() if v == i]
        im = plt.scatter([x[0] for x in selected], [x[1] for x in selected], c=color_map[int(i)], s=1, marker='s')#s=0.1)
    fig.savefig(os.path.join(output_dir, "umap.png"), dpi=my_dpi)

    # Force a draw so we can grab the pixel buffer
    canvas.draw()
    # grab the pixel buffer and dump it into a numpy array
    X = np.array(canvas.renderer.buffer_rgba())
    return img2info(X, color_map, group2cellname, expr_path, output_dir)

def img2info(image, color_map, group2cellname, expr_path, output_dir):
    X = np.rot90(np.fliplr(rgba2rgb(image)))
    rgb_colormap = {str(k): hex2rgb(v) for k, v in color_map.items()}

    cluster2coord = dict()
    cluster2coord = dict.fromkeys([str(x) for x in np.unique(list(rgb_colormap.keys()))])  

    for x in range(X.shape[0]):
        for y in range(X.shape[1]):
            if not np.all(X[x,y]==[255,255,255]):

                for c in rgb_colormap:
                    if np.all(X[x,y] == rgb_colormap[c]):
                        if not cluster2coord[c]:
                            cluster2coord[c] = {"type_det": [group2cellname[c]], "coordinates": [], "de_data": get_df(c, expr_path, output_dir)}
                        cluster2coord[c]["coordinates"].append((x,y))
                        break
    return cluster2coord

def get_df(cluster, expr_path, output_dir):
    expr_df = pd.read_csv(expr_path, sep='\t')
    expr_df = expr_df.rename(columns={'group': 'clusterID', 'logfoldchanges': 'avg_logFC', 'pvals': 'p_val', 'pvals_adj': 'p_val_adj'})
    res = expr_df[expr_df['clusterID']==int(cluster)].drop(['names', 'scores', 'max', 'mean', 'median', 'min', 'percentile_25', 'percentile_75'], axis=1)
    res = res[res['p_val_adj']<=0.05] 
    res_path = os.path.join(output_dir, "expr."+cluster+".tsv")
    res.to_csv(res_path, sep='\t', index=True) 
    return  os.path.relpath(res_path, output_dir) 

def hex2rgb(hex):
    h = hex.lstrip('#')
    return np.array([int(h[i:i+2], 16) for i in (0, 2, 4)])

def rgba2rgb( rgba, background=(255,255,255) ):
    row, col, ch = rgba.shape

    if ch == 3:
        return rgba

    assert ch == 4, 'RGBA image has 4 channels.'

    rgb = np.zeros( (row, col, 3), dtype='float32' )
    r, g, b, a = rgba[:,:,0], rgba[:,:,1], rgba[:,:,2], rgba[:,:,3]

    a = np.asarray( a, dtype='float32' ) / 255.0

    R, G, B = background

    rgb[:,:,0] = r * a + (1.0 - a) * R
    rgb[:,:,1] = g * a + (1.0 - a) * G
    rgb[:,:,2] = b * a + (1.0 - a) * B

    return np.asarray( rgb, dtype='uint8' )    

def form_hdf5(data, output_dir, filter_genes):
    hdf5Path = os.path.abspath(os.path.join(output_dir,"expression.hdf5"))
    n_gene = data.shape[1]
    '''
    if filter_genes:
        ttest_df = sc.get.rank_genes_groups_df(data, group=None, key='t-test')
        genes = list(ttest_df[abs(ttest_df['logfoldchanges'])>1]['names'])

    with h5py.File(hdf5Path, "w") as data_file:
        print("Writing embeddings...")
        coord = data_file.create_group("embedding")
        coord.create_dataset(str(0), data=data.obsm["X_umap"])

        print("Writing intensities...")
        grp = data_file.create_group("intensities")
        for j in range(n_gene):
            if filter_genes:
                if data.var.index[j] in genes:
                    dset = grp.create_dataset(str(j) , data=data.X.getcol(j).toarray())
                    dset.attrs["geneid"] = data.var.index[j]
            else:
                dset = grp.create_dataset(str(j) , data=data.X.getcol(j).toarray())
                dset.attrs["geneid"] = data.var.index[j]
    data_file.close()
    '''
    return hdf5Path

    
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('-f', nargs='+', help='hdf5 file path(s)', required=True)
    parser.add_argument('-t', nargs='+', help='tsv expression file path(s) corresponding order to hdf5s', required=True)
    parser.add_argument('-l',  help='Leiden configuration.', required=False)
    parser.add_argument('-filter_genes', help='Filter genes according to logfoldchange', action='store_true')
    parser.add_argument('-fig', help='Pixel size of an image', required=False)
    parser.add_argument('-o', help='Output directory path.', required=True)

    args = parser.parse_args()

    data_files = args.f
    exp_files = args.t
    output_dir = args.o
    filter_genes = args.filter_genes
    if args.fig:
        figure_pix_size = int(args.fig)
    else:
        figure_pix_size = 200

    if args.l:
        leiden = args.l
    else:
        leiden = 'leiden_0.4'

    sc.settings.autosave = True
    sc.settings.figdir = output_dir
    sc.settings.file_format_figs = 'png'

    for elem in range(len(data_files)):
        obj_path = data_files[elem]
        expr_path = exp_files[elem]

        data = sc.read_h5ad(obj_path)

        #Celltype prediction
        types, group2cellname = celltype(data, leiden)

        #UMAP coordinates and leiden clusters
        coord_tuple = [(float(x[0]), float(x[1])) for x in data.obsm["X_umap"]]
        clusters = data.obs[leiden]#[int(x) for x in data.obs[leiden]]

        leiden_dict = dict(zip(coord_tuple, clusters))

        info = umap(data, group2cellname, leiden_dict, coord_tuple, clusters, leiden, expr_path, output_dir, figure_pix_size)

        #hdf5
        hdf5Path = form_hdf5(data, output_dir, filter_genes)

        #Main config
        to_file = [
                        {
                            "region": 0,
                            "path_upgma": os.path.relpath(os.path.join(output_dir, "umap.png"), future_main_path),
                            "segment_file": None,
                            "hdf5_file": os.path.relpath(hdf5Path, future_main_path),
                            "info" : info
                        }
                    ]

        

        with open(os.path.join(output_dir, "scrnaseq.analysis."+str(elem+1)+".info"), 'w') as outfile:
            json.dump(to_file, outfile, indent=4)
        outfile.close()

        main_config = [
                            {
                                "id": "sc.analysis."+str((elem+1)),
                                "type": "scrna",
                                "type_det": list(types),
                                "color": "#ff0000",
                                "right": None,
                                "png_path": os.path.relpath(os.path.join(output_dir, "umap.png"), future_main_path),
                                "info_path": os.path.relpath(os.path.join(output_dir, "scrnaseq.analysis."+str(elem+1)+".info"), future_main_path),
                                "level": None
                            }
                        ]
        with open(os.path.join(config_path, "scRNAconfig.json"), 'w') as outfile:
            json.dump(main_config, outfile, indent=4)
        outfile.close()




if __name__ == "__main__":
    main() 