import os
import numpy as np
import sys, argparse
from PIL import Image
import imageio
from matplotlib import pyplot as plt
from skimage.exposure import equalize_adapthist
from skimage.restoration import denoise_nl_means, estimate_sigma
import cv2
import keras
from keras.models import Model
from keras import layers as klayers
from keras.optimizers import Adam
from keras import backend as K
from keras.models import model_from_json
from skimage.color import rgb2gray
from skimage.exposure import rescale_intensity
from skimage.transform import warp
from skimage import transform
from skimage.feature import match_descriptors, ORB, plot_matches
from skimage.feature import match_descriptors, corner_peaks, corner_harris, plot_matches, BRIEF
from skimage.measure import ransac
from skimage import img_as_ubyte
from pyimzml.ImzMLParser import ImzMLParser

def per_pixel_softmax_loss(y_true, y_pred):
    n_classes = 3
    y_true_f = K.reshape(y_true, (-1, n_classes))
    y_pred_f = K.reshape(y_pred, (-1, n_classes))
    return keras.losses.categorical_crossentropy(y_true_f, y_pred_f)

def plot_test_pred(test_image, test_pred, testIdx=0):
    fig = plt.figure(figsize=(12, 12))

    plt.subplot(221)
    plt.imshow(test_image[testIdx, :, :, 0], cmap='gray')
    plt.axis('off')
    plt.title('Test ' + str(testIdx), fontsize=16)

    plt.subplot(222)
    plt.imshow(test_pred[testIdx, :, :, 0], cmap='gray')
    plt.axis('off')
    plt.title('Predict ' + str(testIdx), fontsize=16)
    plt.show()

def compile_model():
    # load json and create model
    json_file = open('model_softmax_hist_640_ZT113.json', 'r')
    loaded_model_json = json_file.read()
    json_file.close()
    model = model_from_json(loaded_model_json)
    # load weights into new model
    model.load_weights("model_softmax_hist_ZT113.h5")
    print("Loaded model from disk")

    # evaluate loaded model on test data
    model.compile(optimizer=Adam(lr=1e-5), loss=per_pixel_softmax_loss, metrics=['accuracy'])
    print("After loading model")
    return model

def predict_mask(model, img_path):
    #input_shape = (960, 1280, 1)
    input_shape = (480, 640, 1)
    n_test_image = 1


    # load test images
    test_image = np.empty(n_test_image * input_shape[0] * input_shape[1] )
    test_image = test_image.reshape((n_test_image, ) + input_shape)

    patch_kw = dict(patch_size=5,      # 5x5 patches
                    patch_distance=6,  # 13x13 search area
                    multichannel=True)

    img = cv2.imread(img_path)
    img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    img = np.asarray(img, dtype=np.float32)
    img = img/np.max(img)
    test_image[0, :, :, 0] = img[:input_shape[0], :input_shape[1]]

    test_pred = model.predict(test_image)

    result_image = np.empty(n_test_image * input_shape[0] * input_shape[1])
    result_image = result_image.reshape((n_test_image, ) + input_shape)
    for i in range(n_test_image):
        predicted = test_pred[i,:,:,:]
        tmp = np.zeros((predicted.shape[0], predicted.shape[1]), dtype=int)
        for r in range(tmp.shape[0]):
            for c in range(tmp.shape[1]):
                tmp[r,c] = np.argmax(predicted[r,c])
        result_image[i,:,:] = tmp.reshape(input_shape)

    result_image = result_image.astype(int)
    return test_image[0,:,:,:], result_image[0,:,:,0]

def start_ransac(img1, img2, brief=True, common_factor=0.25):

    img1 = transform.rescale(img1, common_factor, multichannel=False)
    img2 = transform.rescale(img2, common_factor, multichannel=False)

    print(img1.shape)
    print(img2.shape)

    if brief:
        #BRIEF
        keypoints1 = corner_peaks(corner_harris(img1), min_distance=5)
        keypoints2 = corner_peaks(corner_harris(img2), min_distance=5)

        extractor = BRIEF()

        extractor.extract(img1, keypoints1)
        keypoints1 = keypoints1[extractor.mask]
        descriptors1 = extractor.descriptors

        extractor.extract(img2, keypoints2)
        keypoints2 = keypoints2[extractor.mask]
        descriptors2 = extractor.descriptors

        matches12 = match_descriptors(descriptors1, descriptors2, cross_check=True)
    else:
        #ORB
        orb = ORB(n_keypoints=1000, fast_threshold=0.05)

        orb.detect_and_extract(img1)
        keypoints1 = orb.keypoints
        desciptors1 = orb.descriptors

        orb.detect_and_extract(img2)
        keypoints2 = orb.keypoints
        desciptors2 = orb.descriptors

        matches12 = match_descriptors(desciptors1, desciptors2, cross_check=True)

    
    src = keypoints2 [ matches12[:, 1]][:, ::-1]
    dst = keypoints1 [ matches12[:, 0]][:, ::-1]

    model_robust, inliers = \
        ransac((src, dst), transform.SimilarityTransform, min_samples=4, max_trials=100, residual_threshold=2)

    model_robust_tmatrix =  np.copy(model_robust.params)
    model_robust_tmatrix[0, 2] = model_robust_tmatrix[0, 2]/common_factor
    model_robust_tmatrix[1, 2] = model_robust_tmatrix[1, 2]/common_factor
    
    img1_ = img1
    img2_ = warp(img2, model_robust.inverse)

    if False:

        fig = plt.figure(constrained_layout=True)
        gs = fig.add_gridspec(3, 2)
        f_ax1 = fig.add_subplot(gs[0, :])
        plot_matches(f_ax1, img1, img2, keypoints1, keypoints2, matches12)
        f_ax1.axis('off')
        f_ax2 = fig.add_subplot(gs[1, 0])
        f_ax2.imshow(img1)
        f_ax2.axis('off')
        f_ax2.set_title("img1")
        f_ax3 = fig.add_subplot(gs[1, 1])
        f_ax3.imshow(img1_)
        f_ax3.axis('off')
        f_ax3.set_title("img1_")
        #f_ax4 = fig.add_subplot(gs[1, 2])
        #f_ax4.imshow(img3_)
        #f_ax4.axis('off')
        #f_ax4.set_title("img3_")
        f_ax5 = fig.add_subplot(gs[2, 0])
        f_ax5.imshow(img2)
        f_ax5.axis('off')
        f_ax5.set_title("img2")
        f_ax6 = fig.add_subplot(gs[2, 1])
        f_ax6.imshow(img2_)
        f_ax6.axis('off')
        f_ax6.set_title("img2_")
        #f_ax7 = fig.add_subplot(gs[2, 2])
        #f_ax7.imshow(img4_)
        #f_ax7.axis('off')
        #f_ax7.set_title("img4_")
        plt.show()

    return model_robust_tmatrix

def rescale_transform_matrix(matrix, factor):
    matrix[0, 2] = matrix[0, 2]/factor
    matrix[1, 2] = matrix[1, 2]/factor
    return matrix


def register(path_img1, path_img2):
    model = compile_model()
    test_image, result_image = predict_mask(model, path_img1)
    test_image2, result_image2 = predict_mask(model, path_img2)

    trans = start_ransac(img1=result_image, img2=result_image2, brief=True, common_factor=0.2)

    img1_ = result_image
    img2_ = warp(result_image2, np.linalg.inv(trans))

    rescale_trans = np.amin([ test_image.shape[0]/result_image.shape[0], test_image2.shape[1]/result_image2.shape[1]])  
    rescaled_transform = rescale_transform_matrix(trans, rescale_trans)

    reg = warp(test_image2, np.linalg.inv(rescaled_transform))
    return reg
