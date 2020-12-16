import os
import json 
import register_pair
import stlstuff

import numpy as np
import sys, argparse, os, imageio
import skimage
from skimage.transform import warp
from skimage.color import rgb2gray
from skimage import img_as_ubyte
from skimage.transform import resize, warp
from skimage import measure
from skimage import io


import matplotlib

import nrrd
import glob

from numpy import sin, cos, pi
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D

from collections import defaultdict

from pythreejs import *




def createStlModel( images, outname, outname_plaque, full=False, innerMargin=10, outerMargin=10, thickness=10 ):

    V = None

    slideSpacing = innerMargin+thickness
    sliceWidth = thickness

    if slideSpacing < sliceWidth:
        slideSpacing = sliceWidth

    numElems = len(images)

    #this keeps some gap at the top/bottom part
    emptyStart = outerMargin
    emptyEnd = outerMargin

    print(images)

    maxX = 0
    maxY = 0

    for iidx, imgfile in enumerate(images):
        
        print(iidx, imgfile)
        
        image = skimage.io.imread(imgfile)
        rgbimg = rgb2gray(image)

        maxX = max(maxX, rgbimg.shape[0])
        maxY = max(maxY, rgbimg.shape[1])


    V = np.zeros((maxX, maxY, (emptyStart+emptyEnd) + numElems*slideSpacing ))

    for iidx, imgfile in enumerate(images):

        print(iidx, imgfile)
        
        image = skimage.io.imread(imgfile)
        rgbimg = skimage.color.rgb2gray(image)
                   
            
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
        Vtaorta[Vtaorta > 0] = 100

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


if __name__ == "__main__":

    parser = argparse.ArgumentParser(description='Register sequence of images.')
    parser.add_argument('--files', nargs="+", type=argparse.FileType('r'), required=True, help="info files from to_aorta3d function")
    parser.add_argument('--output', type=argparse.FileType('w'), required=True, help="output path of server config file")
    parser.add_argument('--id', type=str, required=True, help="the primary ID given to all samples")
    parser.add_argument('--type', type=str, required=False, default="msi", help="experiment type for aorta3d")

    parser.add_argument('--onlyconf', action="store_true", required=False, default=False, help="experiment type for aorta3d")

    result_config = {}

    args = parser.parse_args()

    fileInfos = {}
    sampleIDs = []

    for inFile in args.files:
        print(inFile.name)
        fname = os.path.abspath(inFile.name)

        # this is a bit hacky and should maybe be replaced later ...
        sampleInfos = json.load(inFile)

        for sidx, fileinfo in enumerate(sampleInfos):
            print([key for key in fileinfo])

            sid = (fname, sidx)            
            fileinfo["path_upgma"] = os.path.abspath(fileinfo["path_upgma"])
            fileInfos[sid] = fileinfo

        sampleIDs.append( sid )

    images = []
    segmentFiles = []
    for infoID in sampleIDs:
        fileInfo = fileInfos[infoID]

        imgPath = fileInfo["path_upgma"]
        img = io.imread(imgPath)
        img = skimage.color.rgb2gray(img)

        img = np.asarray(img, dtype=np.float32)

        images.append(img)

        simg = np.load(fileInfo["segment_file"])
        simg[simg > 0] = 1

        simg = np.asarray(simg, dtype=np.float32)
        simg = resize(simg, (simg.shape[0]*4, simg.shape[1]*4))

        segmentFiles.append(simg)

    masks, segs = get_msi_masks(images)
    
    masks = [resize(rgb2gray(m), (m.shape[0]*4, m.shape[1]*4)) for m in masks]
    images = [resize(rgb2gray(img), (img.shape[0]*4, img.shape[1]*4)) for img in segs]
    images = [img.astype(int) for img in images]


    mostSimilar = getMostSimilar(masks)
    mostSimMask = masks[mostSimilar]
    mostSimilarInfo = fileInfos[sampleIDs[mostSimilar]]

    print("Determined most similar image: {}, {}".format(mostSimilar, mostSimilarInfo["path_upgma"]))

    eval_diff = 0

    for i in range(len(sampleIDs)):


        curInfo = fileInfos[sampleIDs[i]]

        curSegmentation = segmentFiles[i]
        curImgMask = masks[i]
        curImg = images[i]

        outName = curInfo["path_upgma"]
        stlObjectPath = outName + "_model.stl"

        if not args.onlyconf:

            if i != mostSimilar:
                cf=1.0

                trans=None

                while trans is None or np.isnan(np.min(trans)):
                    trans = register_pair.start_ransac(img1=mostSimMask, img2=curImgMask, brief=True, common_factor=cf)
                    print("Calculating trans")

                print(trans)
                
                reg_mask = warp(curImgMask, np.linalg.inv(trans))
                eval_diff += difference(mostSimMask, reg_mask)/mostSimMask.size

                reg_image = warp(curImg, np.linalg.inv(trans), mode='constant', cval=0, preserve_range=True)
                reg_image = reg_image/np.max(reg_image)

                reg_segmentation = warp(curSegmentation, np.linalg.inv(trans), mode='constant', cval=0, preserve_range=True)

                print("sim_mask", mostSimMask.shape, np.min(mostSimMask), np.max(mostSimMask))
                print("cur_mask", curImgMask.shape, np.min(curImgMask), np.max(curImgMask))
                print("cur_img", curImg.shape, np.min(curImg), np.max(curImg))
                print("cur_seg", curSegmentation.shape, np.min(curSegmentation), np.max(curSegmentation))
                print("reg_img", reg_image.shape, np.min(reg_image), np.max(reg_image))
                print("reg_seg", reg_segmentation.shape, np.min(reg_segmentation), np.max(reg_segmentation))

                print(outName, curImgMask.shape, reg_mask.shape, curImg.shape, reg_image.shape)
                
            else:
                reg_mask = img_as_ubyte(curImgMask)
                reg_image = img_as_ubyte(curImg)
                reg_segmentation = img_as_ubyte(curSegmentation)

            matplotlib.image.imsave(outName + '_regm.png', reg_mask, cmap='gray')
            matplotlib.image.imsave(outName + '_reg.png', reg_image, cmap='gray')
            matplotlib.image.imsave(outName + '_reg_seg.png', reg_segmentation, cmap='gray')

            createStlModel([outName + '_reg_seg.png'], stlObjectPath, None, full=True)
            
        fileInfos[sampleIDs[i]]["path"] = stlObjectPath

    stlFiles = [fileInfos[fname]["path_upgma"]+ '_reg_seg.png' for fname in sampleIDs]
    
    modelOutDir = os.path.dirname(args.output.name)
    
    if not args.onlyconf:
        createStlModel( stlFiles,
                    os.path.join(modelOutDir,"{}_model.stl".format(args.id)),
                    None, #os.path.join(modelOutDir,"{}_model_plaque.stl").format(args.id),
                    full=True, innerMargin=10, outerMargin=10, thickness=10
                    )




    serverConfig = []

    for fIdx, fname in enumerate(fileInfos):

        fInfo = fileInfos[fname]

        allDetTypes = []

        for clusterID in fInfo["info"]:
            detTypes = fInfo["info"][ clusterID ]["type_det"]
            allDetTypes += detTypes

        allDetTypes = list(set(allDetTypes))


        fileDict = {}

        fileDict["id"] = "{}.{}".format(args.id, fIdx)
        fileDict["type"] = "msi"
        fileDict["type_det"] = allDetTypes
        fileDict["color"] = "#ff0000"
        fileDict["right"] = 0 # what does that do?
        fileDict["path"] = os.path.abspath(fInfo["path"]) #stl
        fileDict["png_path"] = os.path.abspath(fInfo["path_upgma"]) #png for click-map
        fileDict["info_path"] = fname[0] # info file
        
        serverConfig.append(fileDict)

    json.dump(serverConfig, args.output, indent = 4) 

    """
    [
    {   
        "id": "1",
        "type": "scheme",
        "type_det": ["plaque"],
        "color": "#00b9ff",
        "right": 0,
        "path": "model/mini_plaque_slide/mini_plaque.small.stl",
        "png_path": "../data/models/mini_plaque_slide/mini_plaque.small.png",
        "info_path": "../data/models/mini_plaque_slide/mini_plaque.info"
    }, ...

    ]
    """
