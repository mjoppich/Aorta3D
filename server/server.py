import argparse
import datetime
import pickle
import regex
import sys
import os
import shlex

sys.path.insert(0, str(os.path.dirname(os.path.realpath(__file__))) + "/../")


import time
import io
from stl import mesh
import stl
import tempfile
from flask import Flask, jsonify, request, redirect, url_for, send_from_directory, send_file, make_response
import json
import pprint
from collections import defaultdict, Counter

from flask_cors import CORS

import base64

import logging

logger = logging.getLogger(__name__)

dataurl = str(os.path.dirname(os.path.realpath(__file__))) + "/../" + 'frontend/src/static/'
config_path = str(os.path.dirname(os.path.realpath(__file__))) + "/configs/"

app = Flask(__name__, static_folder=dataurl, static_url_path='/static')
CORS(app)

app.config['DEBUG'] = False
app.config['UPLOAD_FOLDER'] = ""

allConfigFiles = [config_path]

#https://stackoverflow.com/questions/22281059/set-object-is-not-json-serializable
def set_default(obj):
    if isinstance(obj, set):
        return list(obj)
    if isinstance(obj, tuple):
        return list(obj)
    raise TypeError

# For a given file, return whether it's an allowed type or not
def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1] in app.config['ALLOWED_EXTENSIONS']


@app.route('/')
def root():
    retFile = 'index.html'
    return app.send_static_file(retFile)


@app.route('/model/<path:filename>')
def models(filename):
    print(filename)
    retFile = "../data/models/" +filename
    return send_from_directory("../data/models", filename)




@app.route('/get_model', methods=['POST'])
def get_model():

    content = request.get_json(silent=True)
    fetchID = content.get("id", -1)

    config_file = loadConfigs()

    targetInfo = None
    data = {"model": None}

    for elem in config_file:
        if elem["id"] == fetchID:
            targetInfo = elem
            break

    eStlPath = eval_path(__file__, elem["path"])

    logger.warning("Loading stl path {}".format(eStlPath))

    main_body = mesh.Mesh.from_file(eStlPath)

    with tempfile.NamedTemporaryFile() as fout:
        logger.warning("Before write {}".format(""))
        main_body.save("test.stl", fh=fout, mode=stl.Mode.ASCII)
        logger.warning("after write {}".format(fout.name))
        with open(fout.name, "rb") as fin:
            encoded = base64.b64encode(fin.read())
            data = {"model": encoded.decode()}


    response = app.response_class(
        response=json.dumps(data),
        status=200,
        mimetype='application/json'
    )
    return response


def eval_path( currentPath, evalPath):

    if not os.path.isabs(currentPath):
        currentPath = os.path.abspath(currentPath)

    logger.warning("Loading path {} from {}".format(currentPath, evalPath))

    if os.path.isabs(evalPath):
        return evalPath

    baseFolder = os.path.abspath(currentPath)

    if not os.path.isdir(baseFolder):
        baseFolder = os.path.dirname(baseFolder)

    evalPath = os.path.abspath(os.path.join(baseFolder, evalPath))
    return evalPath


@app.route('/test', methods=['GET', 'POST'])
def test():
    return "<html><body>miRExplore Server v0.01</body></html>", 200, None

def loadConfigs():

    allConfigFiles = [f for f in os.listdir(config_path) if os.path.isfile(os.path.join(config_path, f)) and f.endswith(".json")]
    allconfigs = []

    for configFile in allConfigFiles:

        #logger.warning("Loading config {}".format(configFile))
        
        with open(os.path.join(config_path, configFile)) as f:
            config_file = json.load(f)

            for x in config_file:
                x["id"] = configFile + ":" + str(x["id"])

                if "parent" in x:
                    x["parent"] = configFile + ":" + str(x["parent"])

            allconfigs = config_file + allconfigs

    return allconfigs

@app.route('/fetchViewableData', methods=['POST'])
def fetchViewableData():
    
    config_file = loadConfigs()

    reduced_data = []
    counter = 0

    boundingBox = {"x": (0,0), "y": (0,0), "z": (0,0)}

    for elem in config_file:

        if not "path" in elem:
            continue

        if not elem["path"].upper().endswith("STL"):
            continue

        if args.view_all or elem.get("id").startswith("scheme"): 
            reduced_data.append(elem)

            eStlPath = eval_path(__file__, elem["path"])
            logger.warning("Loading stl path {}".format(eStlPath))

            main_body = mesh.Mesh.from_file(eStlPath)
        
            boundingBox["x"] = ( float( min([boundingBox["x"][0], main_body.x.min()])), float(max([boundingBox["x"][1], main_body.x.max()])) )
            boundingBox["y"] = ( float( min([boundingBox["y"][0], main_body.y.min()])), float(max([boundingBox["y"][1], main_body.y.max()])) )
            boundingBox["z"] = ( float( min([boundingBox["z"][0], main_body.z.min()])), float(max([boundingBox["z"][1], main_body.z.max()])) )

            logger.warning("Adding viewable file {}".format(elem.get("id")))
    #if len(reduced_data) > 2:
    #    reduced_data = reduced_data[0:2]

    response = app.response_class(
        response=json.dumps({"bbox": boundingBox, "data": reduced_data}, default=set_default),
        status=200,
        mimetype='application/json'
    )
    return response

def geneFound(elementData, gene):

    if not "de_data" in elementData and "info_path" in elementData:

        try:
            # meant for MSI slides
            data = None
            with open(elementData["info_path"]) as f:
                print("Loading", elementData["info_path"])
                elem_info_file = json.load(f)
                data = [x for x in elem_info_file if x.get("region", -1) == elementData.get("region", -2)]

            if len(data) > 0:
                data = data[0]

                elementData = data.get("info", {})#.get(content["cluster"], None)

            else:
                data = None

        except FileNotFoundError:
            return False

    if elementData != None and "de_data" in elementData:
        try:
            with open(elementData["de_data"], 'r') as fin:
                print("Loading", elementData["de_data"])

                colname2idx = {}
                for lidx, line in enumerate(fin):
                    line = line.strip().split("\t")
                    if lidx == 0:
                        for eidx, elem in enumerate(line):
                            colname2idx[elem] = eidx+1

                        continue

                    rowelem = {}
                    for col in colname2idx:
                        rowelem[col] = line[colname2idx[col]]

                    if rowelem["gene"].upper() == gene.upper():
                        return True

        except FileNotFoundError:
            return False

    return False

    

@app.route('/getGeneRelatedData', methods=['POST'])
def getGeneRelatedData():

    content = request.get_json(silent=True)
    fetchID = content.get("id", -1)
    fetchGene = content.get("gene", -1)
    print("id ", fetchID)
    print("gene ", fetchGene)
    config_file = loadConfigs()

    targetInfo = None
    data = []

    for elem in config_file:
        if elem["id"] == fetchID:
            targetInfo = elem
            break

    print("Found elem", targetInfo)

    if targetInfo == None:
        response = app.response_class(
            response=json.dumps([]),
            status=200,
            mimetype='application/json'
        )
        return response

    
    for elem in config_file:
        if elem.get("type", None) in ["scrna", "msi"]:

            geneFoundRes = geneFound(elem, fetchGene)
            print("geneFound ", geneFoundRes, elem.get("info_path", "-"), elem.get("de_data", "-"))
            if geneFoundRes:
                data.append(elem)

    response = app.response_class(
        response=json.dumps(data),
        status=200,
        mimetype='application/json'
    )
    print(data)
    return response

@app.route('/getRelatedData', methods=['POST'])
def getRelatedData():

    content = request.get_json(silent=True)
    fetchID = content.get("id", -1)

    config_file = loadConfigs()

    targetInfo = None
    data = []

    for elem in config_file:
        if elem["id"] == fetchID:
            targetInfo = elem
            break

    print("Found elem", targetInfo)

    if targetInfo == None:
        response = app.response_class(
            response=json.dumps([]),
            status=200,
            mimetype='application/json'
        )
        return response

    

    if targetInfo.get("type", None) == "msi":
        targetPath = targetInfo["path"]
        for elem in config_file:            #look for further regions in the same imZML
            if elem["path"] == targetPath:
                data.append(elem)
    elif targetInfo.get("type", None) == "he":
        for elem in config_file:            #look for channel images that correspond to HE ID AND HE that have 0.1 similar plaque rate
            if elem["type"] == "immuno" and elem["parent"] == fetchID:
                data.append(elem)
            if elem["type"] == "he" and abs(float(elem["plaqueRate"]) - float(targetInfo["plaqueRate"])) <= 0.1:
                data.append(elem)

    else:
        #for elem in config_file:            #look for HE parent image AND the images of different channels
        #    #if elem["type"] == "he" and elem["id"] == targetInfo["parent"]:
        #    #    data.append(elem)
        #    #if elem["type"] == "immuno" and not elem["type_det"] == targetInfo["type_det"]:
        #    #    data.append(elem)

        for elem in config_file:

            detTypes = elem.get("type_det", [])
            if type(detTypes) == str:
                detTypes = [detTypes]

            ints = list(set(detTypes) & set(targetInfo.get("type_det", [])))

            if len(ints) > 0:
                data.append(elem)




    response = app.response_class(
        response=json.dumps(data),
        status=200,
        mimetype='application/json'
    )
    return response


@app.route('/getElementInfoDE', methods=['GET', 'POST'])
def getElementInfoDE():

    content = request.get_json(silent=True)
    fetchID = content.get("id", -1)

    logger.error("Content: {}".format(content))

    config_file = loadConfigs()

    data = {}
    elementData = {}

    for elem in config_file:
        if elem["id"] == fetchID:
            elementData = elem
            break

    lookForRegion = elementData.get("cluster", -2)

    if not "de_data" in elementData and "info_path" in elementData:
        # meant for MSI slides
        data = None
        logger.error("no de_data, but found info_path {}".format(elementData["info_path"]))
        infoFilePath = eval_path(__file__, elementData["info_path"])

        with open(infoFilePath) as f:
            data = json.load(f)[0]
            logger.error("found data for region {}: {}".format(lookForRegion, len(data)))

        if len(data) > 0:
            data = data
            elementData = data.get("info", {}).get(content["cluster"], None)

        else:
            data = None


    else:
        infoFilePath = __file__

    print("Reading Table", elementData.get("de_data", None))

    deTable = []
    if elementData != None and "de_data" in elementData:

        deDataPath = eval_path(infoFilePath, elementData["de_data"])
        
        with open(deDataPath, 'r') as fin:

            colname2idx = {}
            for lidx, line in enumerate(fin):
                line = line.strip().split("\t")
                if lidx == 0:
                    for eidx, elem in enumerate(line):
                        colname2idx[elem] = eidx+1

                    continue

                rowelem = {}
                for col in colname2idx:
                    rowelem[col] = line[colname2idx[col]]
                                        
                
                deTable.append(rowelem)
    
    response = app.response_class(
        response=json.dumps(deTable),
        status=200,
        mimetype='application/json'
    )
    return response


@app.route('/getElementInfoImage', methods=['GET', 'POST'])
def getElementInfoImage():

    content = request.get_json(silent=True)
    fetchID = content.get("id", -1)

    config_file = loadConfigs()

    data = {}
    elementData = {}

    for elem in config_file:
        if elem.get("id") == fetchID:
            elementData = elem
            break
    if "png_path" in elementData:
        eImgPath = eval_path(__file__, elementData["png_path"])

        with open(eImgPath, 'rb') as f:
            logger.warning("Loading img path {}".format(eImgPath))
            encoded = base64.b64encode(f.read())
            data = {"image": encoded.decode()}

    elif "info_path" in elementData:
        eInfoPath = eval_path(__file__, elementData["info_path"])

        with open(eInfoPath) as f:
            elem_info_file = json.load(f)
            data = [x for x in elem_info_file if x.get("region", -1) == elementData.get("region", -2)]

        assert(len(data) <= 1)

        if len(data) == 0:
            data = {}
        elif len(data) == 1:
            data = data[0]

        if "path_upgma" in data:
            encoded = base64.b64encode(open( eval_path(__file__, data["path_upgma"]) , "rb").read())
            data = {"image": encoded.decode()}
    else:
        data = {}


    response = app.response_class(
        response=json.dumps(data),
        status=200,
        mimetype='application/json'
    )
    return response


@app.route('/getElementInfo', methods=['GET', 'POST'])
def getElementInfo():

    content = request.get_json(silent=True)
    fetchID = content.get("id", -1)

    config_file = loadConfigs()

    data = {}
    elementData = {}

    for elem in config_file:
        if elem.get("id") == fetchID:
            elementData = elem
            break

    if "info_path" in elementData:
        eInfoPath = eval_path(__file__, elementData["info_path"])
        logger.warning(eInfoPath)

        with open(eInfoPath) as f:
            elem_info_file = json.load(f)

            if elementData.get("type") == "msi":
                
                assert(len(elem_info_file) == 1)

                data = elem_info_file[0]#[x for x in elem_info_file if x.get("region", -1) == elementData.get("region", -2)]
            else:
                data["info"] = elem_info_file[0]

        #assert(len(data) <= 1)

        #if len(data) == 0:
        #    data = {}
        if len(data) == 1 and isinstance(data, (tuple, list)):
            data = data[0]

    else:
        logger.error("no info_path in elementData")

    if len(data) == 0:
        logger.error("Returning 0 len data in getElementInfo for element id {}".format(fetchID))
        logger.error("{}".format(elementData))

    response = app.response_class(
        response=json.dumps(data),
        status=200,
        mimetype='application/json'
    )
    return response


@app.route('/getElement', methods=['GET', 'POST'])
def getElement():

    content = request.get_json(silent=True)
    fetchID = content.get("id", -1)

    config_file = loadConfigs()

    data = {}

    for elem in config_file:
        if elem.get("id") == fetchID:
            data = elem
            break

    if len(data) == 0:
        logger.error("Returning 0 len data in getElement")
        logger.error("Was looking for data element: {}".format(fetchID))

    response = app.response_class(
        response=json.dumps(data),
        status=200,
        mimetype='application/json'
    )
    return response

@app.route('/getElementImage', methods=['POST'])
def getElementImage():

    content = request.get_json(silent=True)
    fetchID = content.get("id", -1)
    if fetchID == -1:
        return app.response_class(
        response="Bad request",
        status=400    )

    config_file = loadConfigs()

    data = None
    fname = None

    for elem in config_file:
        if elem.get("id") == fetchID:
            data = elem
            break

    testImage = os.path.dirname(os.path.abspath(__file__)) + "/../data/images/test_image.png"

    if data == None or not "png_path" in data:
        fname = testImage
    
    else:   
        fname = os.path.dirname(os.path.abspath(__file__)) + "/../" + data.get("png_path")

    if not os.path.exists(fname) or fname == None:
        fname = testImage


    encoded = base64.b64encode(open(fname, "rb").read())

    response = app.response_class(
        response=json.dumps({"image": encoded.decode()}),
        status=200,
        mimetype='application/json'
    )
    return response 

@app.route('/stats', methods=['GET', 'POST'])
def stats():

    config_file = loadConfigs() 

    datasets = 0
    datatypes = Counter()
    datasubtypes = defaultdict(set)

    for elem in config_file:
        datasets += 1
        type_ = elem.get("type")
        if type_ is None:
            type_ = "other"
        datatypes[type_] += 1
        if "type_det" in elem:
            type_det = elem.get("type_det", [None])

            if type_det == None or len(type_det) == 0:
                continue

            type_det = type_det

            for td in type_det:
                datasubtypes[type_].add(td)
    
    data = {"datasets": datasets, "datatypes": list(datatypes.keys()), "datasubtypes": datasubtypes, "overview": datatypes}
    response = app.response_class(
        response=json.dumps(data, default=set_default),
        status=200,
        mimetype='application/json'
    )
    return response

@app.route('/help', methods=['GET', 'POST'])
def help():
    res = "<html><body><ul>"

    for x in [rule.rule for rule in app.url_map.iter_rules() if rule.endpoint !='static']:
        res += "<li>"+str(x)+"</li>"

    res +="</body></html>"

    return res, 200, None




def start_app_from_args(args):

    logger.info("Starting From Args finished")


def getCLParser():
    parser = argparse.ArgumentParser(description='Start miRExplore Data Server', add_help=False)

    parser.add_argument('-p', '--port', type=int, help="port to run on", required=False, default=5005)
    parser.add_argument('-h', '--host', type=str, help="port to run on", required=False, default="0.0.0.0")
    parser.add_argument('-v', '--view-all', action="store_true", default=False, help="View all elements with model?", required=False)

    return parser

if __name__ == '__main__':

    """
    --port
    5005
    --host
    0.0.0.0

    """



    parser = getCLParser()

    args = parser.parse_args()

    for x in args.__dict__:
        print(x, args.__dict__[x])

    print("Starting Flask on port", args.port)
    loadConfigs()

    start_app_from_args(args)

    print([rule.rule for rule in app.url_map.iter_rules() if rule.endpoint != 'static'])
    app.run(threaded=True, host="0.0.0.0", port=args.port)

def gunicorn_start( datadir="",
                    sentdir="",
                    feedbackFile=None):

    parser = getCLParser()

    argstr = "--host {host} --port {port}".format(host="0.0.0.0", port="5005")

    print("Starting app with")
    print(argstr)

    args = parser.parse_args(shlex.split(argstr))

    start_app_from_args(args)

    return app