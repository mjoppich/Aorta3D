import os
import json 
import cv2
import register_pair
import numpy as np
import sys, argparse, os, imageio
<<<<<<< HEAD
from skimage import io, data
from skimage.transform import warp
=======
from skimage import io
>>>>>>> b6287cfd51eef520a4d163f642d7b6f2dd678075
from skimage.color import rgb2gray
from skimage import img_as_ubyte
from skimage.transform import resize, warp
import matplotlib

import nrrd
import glob

from numpy import sin, cos, pi
from skimage import measure
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D

from collections import defaultdict
from stl import mesh

from pythreejs import *

class SurfaceNets:

    def __init__(self):

        self.cube_edges = None
        self.edge_table = None

        k = 0
        cube_edges = {}
        for  i in range(0,8):
            for j in [1,2,4]:
                p = i^j

                if i <= p:
                    cube_edges[k] = i
                    k += 1
                    cube_edges[k] = p
                    k += 1

        self.cube_edges = [0] * k

        for x in cube_edges:
            self.cube_edges[x] = cube_edges[x]

        self.cube_edges = tuple(self.cube_edges)


        self.edge_table = [0] * 256
        for i in range(0, 256):
            em = 0

            for j in range(0, 24, 2):
                a = not (i & (1 << cube_edges[j]))
                b = not (i & (1 << cube_edges[j+1]))

                em |= (1 << (j >> 1)) if a != b else 0

            self.edge_table[i] = em
            
        self.edge_table = tuple(self.edge_table)


    def surface_net(self, data, level=1):

        R = [0] * 3
        x = [0] * 3
        grid = [0] * 8

        vertices = []
        faces = []

        buf_no = 1
        n = 0
        m = 0

        dims = data.shape
        
        print(dims)

        R[0] = 1
        R[1] =  dims[0] + 1
        R[2] = (dims[0] + 1) * (dims[1] + 1)

        buffer = [0] * 4096

        if R[2] * 2 >= len(buffer):
            buffer = [0] * (R[2]*2)

        vdata = np.array(data, copy=True)
        vdata = np.reshape(vdata, dims[0]*dims[1]*dims[2])
                
        vdata = [0] * dims[0]*dims[1]*dims[2]
        vdata = np.array(vdata)
        
        for i in range(0, dims[0]):
            for j in range(0, dims[1]):
                for k in range(0, dims[2]):       
                    
                    vidx = i + dims[0] * j + dims[0]*dims[1] * k
                    
                    if vidx >= len(vdata):
                        print(i,j,k, dims)
                    
                    vdata[vidx]= data[i,j,k]

        visIdx = set()
        
        x[2] = 0
        while x[2] < dims[2]-1: # outerloop
            m = 1 + (dims[0]+1) * (1 + (buf_no * (dims[1]+1)))

            x[1] = 0
            while x[1] < dims[1]-1: # middleloop

                x[0] = 0
                while x[0] < dims[0]-1: # innerloop
                    
                    mask = 0
                    g = 0
                    idx = n
                    
                    if idx in visIdx:
                        print("double index")
                    
                    visIdx.add(idx)

                    for k in range(0,2):
                        for j in range(0,2):
                            for i in range(0,2):

                                p = vdata[idx] - level

                                grid[g] = p
                                mask |= (1 << g) if (p<0) else 0

                                # loop stuff

                                #i += 1
                                g += 1
                                idx += 1

                            #j += 1
                            idx += dims[0]-2

                        idx += dims[0] * (dims[1]-2)

                    
                    #print(n, vdata[n], mask, x, dims)
                    if mask == 0 or mask == 0xff:
                        
                        #if mask == 0xff:
                        #    inObj[x[0], x[1], x[2]] = 1
                        #elif mask == 0:
                        #    outObj[x[0], x[1], x[2]] = 0
                            
                        
                        # innerloop
                        x[0] += 1
                        n += 1
                        m += 1
                        continue

                    
                    edge_mask = self.edge_table[mask]

                    v = [0] * 3
                    e_count = 0

                    for i in range(0, 12):


                        if (edge_mask & (1<<i)) == 0:
                            continue

                            
                        e_count += 1

                        e0 = self.cube_edges[ i << 1]
                        e1 = self.cube_edges[(i << 1) + 1]

                        g0 = grid[e0]
                        g1 = grid[e1]

                        t = g0-g1

                        if abs(t) > 1e-2:
                            t = g0 / t
                        else:
                            continue

                        k=1

                        for j in range(0, 3):

                            a = e0 & k
                            b = e1 & k

                            if (a!= b):
                                v[j] += 1.0-t if a else t
                            else:
                                v[j] += 1.0 if a else 0.0

                            k = k << 1



                    s = 1.0/e_count

                    for i in range(0, 3):
                        v[i] = x[i] + s * v[i]


                    #print(m, len(buffer), len(vertices))
                    buffer[m] = len(vertices)
                    vertices.append(v)

                    for i in range(0,3):


                        if not (edge_mask & (1 << i)):
                            continue

                            
                        iu = (i+1)%3
                        iv = (i+2)%3

                        if x[iu] == 0 or x[iv] == 0:
                            continue

                            
                        du = R[iu]
                        dv = R[iv]

                        #print(m, iu, iv, du, dv, m-du-dv, m-du, m-dv)
                        
                        if (mask & 1):
                        
                            faces.append((
                                buffer[m], buffer[m-du-dv], buffer[m-du]
                            ))

                            faces.append((
                                buffer[m], buffer[m-dv], buffer[m-du-dv]
                            ))
                            
                        else:
                            faces.append((
                                buffer[m], buffer[m-du-dv], buffer[m-dv]
                            ))

                            faces.append((
                                buffer[m], buffer[m-du], buffer[m-du-dv]
                            ))
                            
                            
                        
                    ## inner loop update
                    x[0] += 1
                    n += 1
                    m += 1    
                    
                ## middle loop update
                x[1] += 1
                n += 1
                m += 2
                                        

            
            if x[2] % 10 == 0:
                print(x)
            
            ## outer loop update
            x[2] += 1
            n += dims[0]
            buf_no ^= 1
            R[2] = -R[2]
                    
        print("visIdx", len(visIdx), dims[0]*dims[1]*dims[2])
                
        return vertices, faces


def saveMesh(aVertices, aFaces, outname):
    print(len(aVertices), len(aFaces))

    aorta = mesh.Mesh(np.zeros(len(aFaces), dtype=mesh.Mesh.dtype))
    for i, f in enumerate(aFaces):

        for j in range(3):

            aorta.vectors[i][j] = aVertices[f[j]]

    posElem = defaultdict(list)

    for i in range(3):
        for vert in aorta.vectors:
            posElem[i].append(vert[i])

    for posidx in posElem:
        print(posidx, np.min(posElem[posidx]), np.max(posElem[posidx]))

    aorta.save(outname)


def createStlModel( images, outname ):

    V = None

    sliceWidth = 20
    numElems = len(images)

    #this keeps some gap at the top/bottom part
    emptyStart = 10
    emptyEnd = 10

    allimg = sorted(images, key=lambda x : int(x.split("_")[1].split("-")[0]))

    for iidx, imgfile in enumerate(images):
        
        print(imgfile)
        
        image = data.imread(imgfile)
        rgbimg = rgb2gray(image)
        
        if iidx==0:
            V = np.zeros((rgbimg.shape[0], rgbimg.shape[1], (emptyStart+emptyEnd) + numElems*sliceWidth ))
            
        for imgi in range(0, sliceWidth):
            V[:, :, (iidx*sliceWidth)+imgi+emptyStart] = rgbimg
            
            
        if iidx +1 >= numElems:
            print("broke at", iidx, imgfile)
            break
        

    V = V / np.max(V)
    Vt = v * 100

    from skimage.transform import resize

    Vt = Vt.copy()
    Vt = resize(Vt, (Vt.shape[0]/5, Vt.shape[1]/5, Vt.shape[2]/4))

    trshd = 45

    Vtplaque = np.array(Vt, copy=True)  
    Vtaorta = np.array(Vt, copy=True)  

    Vtaorta[Vtaorta > 75] = 0
    Vtaorta[Vtaorta > 40] = 100

    Vtplaque[Vtplaque < 75] = 0
    Vtplaque[Vtplaque > 75] = 100

    sn = SurfaceNets()

    s_aortaVertices,s_aortaFaces = sn.surface_net(Vtaorta, 75)
    s_plaqueVertices,s_plaqueFaces = sn.surface_net(Vtplaque, 75)

    print(len(s_aortaVertices), len(s_aortaFaces))
    print(len(s_plaqueVertices), len(s_plaqueFaces))

    saveAorta(s_aortaVertices,s_aortaFaces, outname)



def difference(a1, a2):
    a1 = a1.flatten()
    a2 = a2.flatten()
    if len(a1) < len(a2):
        a2 = a2[:len(a1)]
    else:
        a1 = a1[:len(a2)]
    return np.sum(np.absolute(a1 - a2))

def getMostSimilar(images):
    dif_list = list() 
    for img1 in images:
        dif = 0
        for img2 in images:
            dif += difference(img1, img2)
        dif_list.append(dif)
    return dif_list.index(min(dif_list))

def check_neighbour(mat, x, y, background):
    if x < mat.shape[0]-1 and mat[x+1][y]==background:
        return True
    elif x > 1 and mat[x-1][y]==background:
        return True
    elif y < mat.shape[1]-1 and mat[x][y+1]==background:
        return True
    elif y > 1 and mat[x][y-1]==background:
        return True
    elif x < mat.shape[0]-1 and y < mat.shape[1]-1 and mat[x+1][y+1]==background:
        return True
    elif x > 1 and y > 1 and mat[x-1][y-1]==background:
        return True
    elif x < mat.shape[0]-1 and y > 1 and mat[x+1][y-1]==background:
        return True
    elif y < mat.shape[1]-1 and x > 1 and mat[x-1][y+1]==background:
        return True
    else:
        return False

def get_msi_masks(images):
    masks = [np.copy(image) for image in images]
    segs = [np.copy(image) for image in images]
    for k in range(len(images)):
        mask = masks[k]
        seg = segs[k]

        (values,counts) = np.unique(mask, return_counts=True)
        ind=np.argmax(counts)
        background = values[ind]
        plaque = list()
        #aorta = list()
        for i in range(images[k].shape[0]):
            for j in range(images[k].shape[1]):
                if images[k][i,j] == background:
                    mask[i][j] = 0
                    seg[i][j] = 0
                elif check_neighbour(images[k], i, j, background):# or images[k][i][j] in aorta:
                    mask[i][j] = 1
                    seg[i][j] = 1
                    #aorta.append(images[k][i][j])
                else:
                    if not check_neighbour(images[k], i, j, background) and check_neighbour(seg, i, j, 1) or images[k][i][j] in plaque:
                        seg[i][j] = 2
                        plaque.append(images[k][i][j])
                    else: 
                        seg[i][j] = 0
                    mask[i][j] = 0
        
        masks[k] = mask
        segs[k] = seg
    return masks, segs


def main():
    parser = argparse.ArgumentParser(description='Register sequence of images.')
    parser.add_argument('--msi', action='store_true')
    parser.add_argument('--files', nargs="+", type=str, required=True)
    parser.add_argument('--masks', nargs="+", type=str, )
    parser.add_argument('--o', type=str, required=True)

    result_config = {}

    args = parser.parse_args()

    msi = args.msi
    paths = sorted(args.files)
    mask_paths = args.masks
    output_dir = args.o

    if mask_paths:
        images = [ cv2.imread(img_path) for img_path in paths]
        images = [ cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) for img in images]
        images = [ np.asarray(img, dtype=np.float32) for img in images]

        mask_paths = sorted(mask_paths)
        masks = [ cv2.imread(path) for path in mask_paths]
        if not msi:
            masks = [ cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) for img in masks]
        masks = [ np.asarray(img, dtype=np.float32) for img in masks]

        _, segs = main_register.get_msi_masks(images)
        images = [resize(img, (img.shape[0]*4, img.shape[1]*4)) for img in segs]
        images = [img.astype(int) for img in images]

    elif msi:
        images = [ cv2.imread(img_path) for img_path in paths]
        images = [ cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) for img in images]
        images = [ np.asarray(img, dtype=np.float32) for img in images]
        
        masks, segs = get_msi_masks(images)
        
        masks = [resize(m, (m.shape[0]*4, m.shape[1]*4)) for m in masks]
        images = [resize(img, (img.shape[0]*4, img.shape[1]*4)) for img in segs]
        images = [img.astype(int) for img in images]
    else:
        model = register_pair.compile_model()

        images = [register_pair.predict_mask(model, p)[0] for p in paths]
        masks = [register_pair.predict_mask(model, p)[1] for p in paths]

    mostSimilar = getMostSimilar(masks)
    mostSimilar_fname = paths[mostSimilar].split("/")[-1]

    res = {}
    counter = 0
    eval_diff = 0

    for i in range(len(paths)):
        if i != mostSimilar:
            if msi:
                trans = register_pair.start_ransac(img1=rgb2gray(masks[mostSimilar]), img2=rgb2gray(masks[i]), brief=True, common_factor=1)
            else:
                trans = register_pair.start_ransac(img1=rgb2gray(masks[mostSimilar]), img2=rgb2gray(masks[i]), brief=True, common_factor=0.5)
            reg_mask = warp(masks[i], np.linalg.inv(trans))

            eval_diff += difference(masks[mostSimilar], reg_mask)/masks[mostSimilar].size
            print(masks[i].shape, images[i].shape)
            if msi:
                reg_image = warp(images[i], np.linalg.inv(trans), mode='constant', cval=0, preserve_range=True)
            else:
                rescale_trans = np.amin([ images[i].shape[0]/masks[i].shape[0], images[i].shape[1]/masks[i].shape[1] ])
                rescaled_transform = register_pair.rescale_transform_matrix(trans, rescale_trans)

                reg_image = warp(images[i], np.linalg.inv(rescaled_transform))
            if msi:
                #reg_image = np.nan_to_num(reg_image)
                reg_image = reg_image/np.max(reg_image)
            fname = paths[i].split("/")[-1]
            matplotlib.image.imsave(output_dir + fname + '_regm.png', img_as_ubyte(masks[i]), cmap='gray')
            matplotlib.image.imsave(output_dir + fname + '_reg.png', img_as_ubyte(reg_image), cmap='gray')
            res[counter] = os.path.join(output_dir, fname + '_reg.png')
        else:
            matplotlib.image.imsave(output_dir + mostSimilar_fname + '_regm.png', img_as_ubyte(masks[i]), cmap='gray')
            matplotlib.image.imsave(output_dir + mostSimilar_fname + '_reg.png', img_as_ubyte(images[mostSimilar]), cmap='gray')
            res[counter] = os.path.join(output_dir, mostSimilar_fname + '_reg.png')

        counter += 1

    config = {}
    config["avg_diff"] = round(eval_diff/(len(paths)-1),3)
    config["files"] = res

    createStlModel(res, os.path.join(output_dir,"model.stl"))

    with open(os.path.join(output_dir,"reg_config.json"), "w") as outfile:  
        json.dump(config, outfile, indent = 4) 



if __name__ == "__main__":
    main()