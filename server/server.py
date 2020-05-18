import argparse
import datetime
import pickle
import regex
import sys
import os
import shlex

sys.path.insert(0, str(os.path.dirname(os.path.realpath(__file__))) + "/../")


import time
from io import StringIO

from flask import Flask, jsonify, request, redirect, url_for, send_from_directory
import json
import pprint
from collections import defaultdict, Counter

from flask_cors import CORS

dataurl = str(os.path.dirname(os.path.realpath(__file__))) + "/../" + 'frontend/src/static/'

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
    
    data = [{
        "id": 419,
        "type": "msi",
        "type_det": "Lipids",
        "region": "2",
        "location": "AR",
        "path": "/usr/local/hdd/rita/msimaging/190927_AR_ZT13_Lipids/190927_AR_ZT13_Lipids.imzML",
        "info_path": "/usr/local/hdd/rita/msimaging/190927_AR_ZT13_Lipids/190927_AR_ZT13_Lipids.imzML.info",
        "level": 50
    },
    {
        "id": 420,
        "type": "msi",
        "type_det": "Lipids",
        "region": "3",
        "location": "AR",
        "path": "/usr/local/hdd/rita/msimaging/190927_AR_ZT13_Lipids/190927_AR_ZT13_Lipids.imzML",
        "info_path": "/usr/local/hdd/rita/msimaging/190927_AR_ZT13_Lipids/190927_AR_ZT13_Lipids.imzML.info",
        "level": 50
    }]

    response = app.response_class(
        response=json.dumps(data),
        status=200,
        mimetype='application/json'
    )
    return response

@app.route('/getRelatedData', methods=['POST'])
def getRelatedData():

    content = request.get_json(silent=True)
    fetchID = content.get("id", -1)
    
    data = [{
        "id": 419,
        "type": "msi",
        "type_det": "Lipids",
        "region": "2",
        "location": "AR",
        "path": "/usr/local/hdd/rita/msimaging/190927_AR_ZT13_Lipids/190927_AR_ZT13_Lipids.imzML",
        "info_path": "/usr/local/hdd/rita/msimaging/190927_AR_ZT13_Lipids/190927_AR_ZT13_Lipids.imzML.info",
        "level": 50
    },
    {
        "id": 420,
        "type": "msi",
        "type_det": "Lipids",
        "region": "3",
        "location": "AR",
        "path": "/usr/local/hdd/rita/msimaging/190927_AR_ZT13_Lipids/190927_AR_ZT13_Lipids.imzML",
        "info_path": "/usr/local/hdd/rita/msimaging/190927_AR_ZT13_Lipids/190927_AR_ZT13_Lipids.imzML.info",
        "level": 50
    }]

    response = app.response_class(
        response=json.dumps(data),
        status=200,
        mimetype='application/json'
    )
    return response

@app.route('/getElementInfo', methods=['POST'])
def getElementInfo():

    content = request.get_json(silent=True)
    fetchID = content.get("id", -1)
    
    data = {
        "id": 419,
        "type": "msi",
        "type_det": "Lipids",
        "region": "2",
        "location": "AR",
        "path": "/usr/local/hdd/rita/msimaging/190927_AR_ZT13_Lipids/190927_AR_ZT13_Lipids.imzML",
        "info_path": "/usr/local/hdd/rita/msimaging/190927_AR_ZT13_Lipids/190927_AR_ZT13_Lipids.imzML.info",
        "level": 50
    }

    response = app.response_class(
        response=json.dumps(data),
        status=200,
        mimetype='application/json'
    )
    return response

@app.route('/getElementInfoImage', methods=['POST'])
def getElementInfoImage():

    content = request.get_json(silent=True)
    fetchID = content.get("id", -1)
    
    data = {
        "id": 419,
        "type": "msi",
        "type_det": "Lipids",
        "region": "2",
        "location": "AR",
        "path": "/usr/local/hdd/rita/msimaging/190927_AR_ZT13_Lipids/190927_AR_ZT13_Lipids.imzML",
        "info_path": "/usr/local/hdd/rita/msimaging/190927_AR_ZT13_Lipids/190927_AR_ZT13_Lipids.imzML.info",
        "level": 50
    }

    fname = ".".join(data["path"], data["region"], "upgma.png")
    image_binary = open(fname).readall()

    return send_file(
    io.BytesIO(image_binary),
    mimetype='image/png',
    as_attachment=True,
    attachment_filename=fname)

@app.route('/stats', methods=['GET', 'POST'])
def stats():
    
    data = {"datasets": 10, "datatypes": ["MSI", "Microscopy"]}
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