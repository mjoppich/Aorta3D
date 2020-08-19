import os
import json 
import register_pair
import numpy as np
import sys, argparse
import sys, argparse, os, imageio
from skimage import io
from skimage.transform import warp
from skimage.color import rgb2gray
from skimage import img_as_ubyte


def difference(a1, a2):
    a1 = a1.flatten()
    a2 = a2.flatten()
    return np.sum(np.absolute(a1 - a2))

def getMostSimilar(images):
    dif_list = list() 
    for img1 in images:
        dif = 0
        for img2 in images:
            dif += difference(img1, img2)
        dif_list.append(dif)
    return dif_list.index(min(dif_list))


def main():
    parser = argparse.ArgumentParser(description='Register sequence of images.')
    parser.add_argument('--files', nargs="+", type=str)
    parser.add_argument('--o', type=str)

    result_config = {}

    args = parser.parse_args()

    paths = sorted(args.files)
    output_dir = args.o

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
            trans = register_pair.start_ransac(img1=rgb2gray(masks[mostSimilar]), img2=rgb2gray(masks[i]), brief=True, common_factor=0.5)
            reg_mask = warp(masks[i], np.linalg.inv(trans))

            eval_diff += difference(masks[mostSimilar], reg_mask)/masks[mostSimilar].size

            rescale_trans = np.amin([ images[i].shape[0]/masks[i].shape[0], images[i].shape[1]/masks[i].shape[1] ])
            rescaled_transform = register_pair.rescale_transform_matrix(trans, rescale_trans)

            reg_image = warp(images[i], np.linalg.inv(rescaled_transform))
            fname = paths[i].split("/")[-1]
            imageio.imwrite(output_dir + fname + '_reg.png', img_as_ubyte(reg_image))
            res[counter] = os.path.join(output_dir, fname + '_reg.png')
        else:
            imageio.imwrite(output_dir + mostSimilar_fname + '_reg.png', img_as_ubyte(images[mostSimilar]))
            res[counter] = os.path.join(output_dir, mostSimilar_fname + '_reg.png')
        counter += 1

    config = {}
    config["avg_diff"] = round(eval_diff/(len(paths)-1),3)
    config["files"] = res

    with open(os.path.join(output_dir,"reg_config.json"), "w") as outfile:  
        json.dump(config, outfile, indent = 4) 



if __name__ == "__main__":
    main()