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

from flask import Flask, jsonify, request, redirect, url_for, send_from_directory, send_file, make_response
import json
import pprint
from collections import defaultdict, Counter

from flask_cors import CORS

import base64


dataurl = str(os.path.dirname(os.path.realpath(__file__))) + "/../" + 'frontend/src/static/'
config_path = str(os.path.dirname(os.path.realpath(__file__))) + "/config.json"

app = Flask(__name__, static_folder=dataurl, static_url_path='/static')
CORS(app)

app.config['DEBUG'] = False
app.config['UPLOAD_FOLDER'] = ""


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


@app.route('/test', methods=['GET', 'POST'])
def test():
    return "<html><body>miRExplore Server v0.01</body></html>", 200, None

@app.route('/fetchViewableData', methods=['POST'])
def fetchViewableData():
    
    with open(config_path) as f:
        config_file = json.load(f)

    reduced_data = []

    for elem in config_file:
        if elem.get("type") == "msi" and elem.get("type_det")[0] == "Proteins": #temporary extraction of only MSI data   
            reduced_elem = {"id": elem.get("id"), "type": elem.get("type"), "type_det": elem.get("type_det"), "location": elem.get("location"), "level": elem.get("level")}
            reduced_data.append(reduced_elem)

    f.close()

    response = app.response_class(
        response=json.dumps(reduced_data),
        status=200,
        mimetype='application/json'
    )
    return response


@app.route('/getRelatedData', methods=['POST'])
def getRelatedData():

    content = request.get_json(silent=True)
    fetchID = content.get("id", -1)

    with open(config_path) as f:
        config_file = json.load(f)

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


@app.route('/getElementInfoImage', methods=['GET', 'POST'])
def getElementInfoImage():

    content = request.get_json(silent=True)
    fetchID = content.get("id", -1)

    with open(config_path) as f:
        config_file = json.load(f)

    data = {}
    elementData = {}

    for elem in config_file:
        if elem["id"] == fetchID:
            elementData = elem
            break


    if "info_path" in elementData:
        with open(elementData["info_path"]) as f:
            elem_info_file = json.load(f)
            data = [x for x in elem_info_file if x.get("region", -1) == elementData.get("region", -2)]

        assert(len(data) <= 1)

        if len(data) == 0:
            data = {}
        elif len(data) == 1:
            data = data[0]

        if "path_upgma" in data:
            encoded = base64.b64encode(open(data["path_upgma"], "rb").read())
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

    with open(config_path) as f:
        config_file = json.load(f)

    data = {}
    elementData = {}

    for elem in config_file:
        if elem["id"] == fetchID:
            elementData = elem
            break


    if "info_path" in elementData:
        with open(elementData["info_path"]) as f:
            elem_info_file = json.load(f)
            data = [x for x in elem_info_file if x.get("region", -1) == elementData.get("region", -2)]

        assert(len(data) <= 1)

        if len(data) == 0:
            data = {}
        elif len(data) == 1:
            data = data[0]

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

    with open(config_path) as f:
        config_file = json.load(f)

    data = {}

    for elem in config_file:
        if elem["id"] == fetchID:
            data = elem
            break

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

    with open(config_path) as f:
        config_file = json.load(f)

    data = None
    fname = None

    for elem in config_file:
        if elem["id"] == fetchID:
            data = elem
            break

    testImage = os.path.dirname(__file__) + "../data/images/test_image.png"

    if data == None or not "path" in data:
        fname = testImage
    
    else:   
        if data["type"] == "MSI":
            fname = ".".join([data["path"],"_upgma_", data["region"], ".png"])
        else:
            fname = ".".join([data["path"], ".png"])

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

    with open(config_path) as f:
        config_file = json.load(f)

    datasets = 0
    datatypes = Counter()
    datasubtypes = {}

    for elem in config_file:
        datasets += 1
        type_ = elem.get("type")
        if type_ is None:
            type_ = "other"
        datatypes[type_] += 1
        if "type_det" in elem:
            type_det = elem.get("type_det")[0]
            if type_ in datasubtypes:
                if not (type_det in datasubtypes[type_]):
                    datasubtypes[type_].append(type_det)
            else:
                datasubtypes[type_] = [type_det]
    f.close()
    
    data = {"datasets": datasets, "datatypes": list(datatypes.keys()), "datasubtypes": datasubtypes, "overview": datatypes}
    response = app.response_class(
        response=json.dumps(data),
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

    print(datetime.datetime.now(), "Loading finished")


def getCLParser():
    parser = argparse.ArgumentParser(description='Start miRExplore Data Server', add_help=False)

    parser.add_argument('-p', '--port', type=int, help="port to run on", required=False, default=5005)
    parser.add_argument('-h', '--host', type=str, help="port to run on", required=False, default="0.0.0.0")

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