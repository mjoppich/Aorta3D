import os
import json 
import cv2
import register_pair
import stlstuff

import numpy as np
import sys, argparse, os, imageio
from skimage import io, data
from skimage.transform import warp
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

from pythreejs import *




def createStlModel( images, outname, outname_plaque, full=False ):

    V = None

    slideSpacing = 10
    sliceWidth = 10

    if slideSpacing < sliceWidth:
        slideSpacing = sliceWidth

    numElems = len(images)

    #this keeps some gap at the top/bottom part
    emptyStart = 10
    emptyEnd = 10

    print(images)

    maxX = 0
    maxY = 0

    for iidx, imgfile in enumerate(images):
        
        print(iidx, imgfile)
        
        image = cv2.imread(imgfile)
        rgbimg = rgb2gray(image)

        maxX = max(maxX, rgbimg.shape[0])
        maxY = max(maxY, rgbimg.shape[1])


    V = np.zeros((maxX, maxY, (emptyStart+emptyEnd) + numElems*sliceWidth ))

    for iidx, imgfile in enumerate(images):

        print(iidx, imgfile)
        
        image = cv2.imread(imgfile)
        rgbimg = rgb2gray(image)
                    
            
        for imgi in range(0, sliceWidth):
            V[ 0:rgbimg.shape[0] , 0:rgbimg.shape[1], (iidx*slideSpacing)+imgi+emptyStart] = rgbimg
            
            
        if iidx +1 >= numElems:
            print("broke at", iidx, imgfile)
            break
        

    V = V / np.max(V)
    Vt = V * 100


    Vt = Vt.copy()
    #Vt = resize(Vt, (Vt.shape[0]/5, Vt.shape[1]/5, Vt.shape[2]/4))

    trshd = 45

    Vtaorta = np.array(Vt, copy=True)  

    if full:
        Vtaorta[Vtaorta > 10] = 100

    else:
        Vtaorta[Vtaorta > 75] = 0
        Vtaorta[Vtaorta > 30] = 100


    sn = stlstuff.SurfaceNets()

    s_aortaVertices,s_aortaFaces = sn.surface_net(Vtaorta, 75)
    print(len(s_aortaVertices), len(s_aortaFaces))
    stlstuff.saveAorta(s_aortaVertices,s_aortaFaces, outname)

    if outname_plaque != None:
        Vtplaque = np.array(Vt, copy=True)  
        Vtplaque[Vtplaque < 75] = 0
        Vtplaque[Vtplaque > 75] = 100

        s_plaqueVertices,s_plaqueFaces = sn.surface_net(Vtplaque, 75)
        print(len(s_plaqueVertices), len(s_plaqueFaces))
        stlstuff.saveAorta(s_plaqueVertices,s_plaqueFaces, outname_plaque)

    


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
    parser.add_argument('--output', type=str, required=True)

    result_config = {}

    args = parser.parse_args()

    msi = args.msi
    paths = args.files#sorted(args.files)
    mask_paths = args.masks
    output_dir = args.output

    if mask_paths:
        images = [ cv2.imread(img_path) for img_path in paths]
        images = [ cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) for img in images]
        images = [ np.asarray(img, dtype=np.float32) for img in images]

        mask_paths = sorted(mask_paths)
        masks = [ cv2.imread(path) for path in mask_paths]
        if not msi:
            masks = [ cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) for img in masks]
        masks = [ np.asarray(img, dtype=np.float32) for img in masks]

        _, segs = get_msi_masks(images)
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

    print("Determined most similar image: {}, {}".format(mostSimilar, mostSimilar_fname))

    res = {}
    eval_diff = 0

    for i in range(len(paths)):

        curImgPaths = paths[i]
        curImgMask = masks[i]
        curImg = images[i]

        fname = curImgPaths.split("/")[-1]

        if i != mostSimilar:

            cf = 0.5
            if msi:
                cf=1.0

            trans = register_pair.start_ransac(img1=rgb2gray(masks[mostSimilar]), img2=rgb2gray(curImgMask), brief=True, common_factor=cf)
            
            reg_mask = warp(curImgMask, np.linalg.inv(trans))

            eval_diff += difference(masks[mostSimilar], reg_mask)/masks[mostSimilar].size
            
            if msi:
                reg_image = warp(curImg, np.linalg.inv(trans), mode='constant', cval=0, preserve_range=True)
                reg_image = reg_image/np.max(reg_image)

            else:
                rescale_trans = np.amin([ curImg.shape[0]/curImgMask.shape[0], curImg.shape[1]/curImgMask.shape[1] ])
                rescaled_transform = register_pair.rescale_transform_matrix(trans, rescale_trans)
                reg_image = warp(curImg, np.linalg.inv(rescaled_transform))


            print(curImgPaths, curImgMask.shape, reg_mask.shape, curImg.shape, reg_image.shape)
            
            matplotlib.image.imsave(output_dir + fname + '_regm.png', img_as_ubyte(reg_mask), cmap='gray')
            matplotlib.image.imsave(output_dir + fname + '_reg.png', img_as_ubyte(reg_image), cmap='gray')
            res[i] = os.path.join(output_dir, fname + '_reg.png')


        else:
            matplotlib.image.imsave(output_dir + fname + '_regm.png', img_as_ubyte(masks[i]), cmap='gray')
            matplotlib.image.imsave(output_dir + fname + '_reg.png', img_as_ubyte(images[mostSimilar]), cmap='gray')
            res[i] = os.path.join(output_dir, fname + '_reg.png')

        createStlModel([curImgPaths], os.path.join(output_dir,fname + "_model.stl"), None, full=True)

    config = {}
    config["avg_diff"] = round(eval_diff/(len(paths)-1),3)
    config["files"] = res

    print(paths)
    stlFiles = [os.path.join(output_dir, os.path.basename(x) + "_reg.png") for x in paths]

    createStlModel(stlFiles, os.path.join(output_dir,"model.stl"), os.path.join(output_dir,"model_plaque.stl"))

    with open(os.path.join(output_dir,"reg_config.json"), "w") as outfile:  
        json.dump(config, outfile, indent = 4) 



if __name__ == "__main__":
    main()