import * as React from 'react';

import ChipInput from 'material-ui-chip-input'
import AutoComplete from 'material-ui/AutoComplete'
import axios from 'axios';
import config from '../config';

import * as THREE from 'three';
var STLLoader = require('three-stl-loader')(THREE)

import {
    WebGLRenderer,
    PointLight,
    AmbientLight,
    Mesh
} from 'threact';
import {
    listenerCount
} from 'cluster';

var createCamera = require('perspective-camera')

export interface Aorta3DRendererProps {
    width: number, height: number
};
export interface Aorta3DRendererState {
    globject: any, glScene: any, glCamera: any, glControls: any, width: any, height: any, glRaycaster:any
};



export default class Aorta3DRenderer extends React.Component < Aorta3DRendererProps, Aorta3DRendererState > {

    neo4jd3: any = null;

    constructor(props) {
        super(props);
    }

    public static defaultProps: Partial < Aorta3DRendererProps > = {
        width: 200,
        height: 200,
    };

    initRendering(objs) {
        console.log("init render")
        console.log(objs)

        objs.scene.background = new THREE.Color(0xf0f0f0);
        objs.target = new THREE.Vector3(0, 0, 0);

        console.log(objs)

        return objs;
    }

    componentWillMount() {
        var self = this;

        var width = 1200;
        var height = 800;

        var cameraXOffset = 50;

        var camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
        camera.position.set(cameraXOffset, 0, 0);
        camera.lookAt([0, 0, 0])
        camera.updateProjectionMatrix();

        var controls = require('orbit-controls')({
            position: [cameraXOffset, 0, 0]
        });

        var raycaster = new THREE.Raycaster();

        this.setState({
            globject: [],
            glCamera: camera,
            glControls: controls,
            width: width,
            height: height,
            glRaycaster: raycaster
        });
    }

    loadBaseElement(loader, elempath, mpos = [0, 0, 0], mscale = [1, 1, 1], mcolor = "#ffffff", mrot = [0, 0, 0]) {
        var self = this;

        loader.load(config.getRestAddress() + "/" + elempath, function (geometry) {

            /*

mesh.position.set( -500.0,  -700.0, 0 );
                                        mesh.rotation.set( 0, 0, 0 );
                                        mesh.scale.set( 2,2,2 );

            */
            geometry.computeBoundingBox();
            geometry.center()

            console.log(geometry)
            //var geomSize = {x: geometry.boundingBox.max.x-geometry.boundingBox.min.x, y: geometry.boundingBox.max.y-geometry.boundingBox.min.y, z: geometry.boundingBox.max.z-geometry.boundingBox.min.z}
            //mpos = [-geomSize.x*mscale[0]/2.0 + mpos[0], -geomSize.y*mscale[1]/2.0 + mpos[1], -geomSize.z*mscale[2]/2.0 + mpos[2]]



            console.log("loaded stl")
            console.log(elempath)
            console.log(geometry.boundingBox)

            var curlist = self.state.globject;

            var nmesh = < Mesh key = {
                curlist.length
            }
            geometry = {
                geometry
            }
            material = {
                new THREE.MeshStandardMaterial({
                    color: mcolor
                })
            }
            scale = {
                mscale
            }
            position = {
                mpos
            }
            />;

            curlist.push(nmesh);

            self.setState({
                globject: curlist
            })
        });
    }

    componentDidMount() {


        var self = this;
        var loader = new STLLoader();

        var scaleFactor = 0.1;

        self.loadBaseElement(loader, "model/base/membrane1.stl", [0, 0, 0], [scaleFactor, scaleFactor, scaleFactor], "#ff0000", [0, -Math.PI / 2, 0]);
        self.loadBaseElement(loader, "model/base/membrane2.stl", [0, 0, 0], [scaleFactor, scaleFactor, scaleFactor], "#00ff00", [0, -Math.PI / 2, 0]);
        self.loadBaseElement(loader, "model/base/membrane3.stl", [0, 0, 0], [scaleFactor, scaleFactor, scaleFactor], "#0000ff", [0, -Math.PI / 2, 0]);

        self.loadBaseElement(loader, "model/base/plaque.stl", [0, 0, 0], [scaleFactor, scaleFactor, scaleFactor], "#ff0000", [0, -Math.PI / 2, 0]);
        self.loadBaseElement(loader, "model/base/macrophage.stl", [0, 0, 0], [scaleFactor, scaleFactor, scaleFactor], "#ff0000", [0, -Math.PI / 2, 0]);
        self.loadBaseElement(loader, "model/base/plaque.stl", [0, 0, 0], [scaleFactor, scaleFactor, scaleFactor], "#ff0000", [0, -Math.PI / 2, 0]);

    }

    INTERSECTED: any;
    MOUSE: any;
    CANVAS: any;

    waslogged=false;

    onRender(objs) {

        var self=this;

        if (!this.waslogged)
        {
            console.log(objs)
            this.waslogged=true;
            this.CANVAS = objs.domElement.getElementsByTagName("canvas")[0]

        }

        if ((this.CANVAS) && (this.MOUSE))
        {
            self.state.glRaycaster.setFromCamera(this.MOUSE, objs.camera);

            var intersects = self.state.glRaycaster.intersectObjects(objs.scene.children);
    
            if (intersects.length > 0) {
    
                if (self.INTERSECTED != intersects[0].object) {
    
                    if (self.INTERSECTED) self.INTERSECTED.material.emissive.setHex(self.INTERSECTED.currentHex);
    
                    self.INTERSECTED = intersects[0].object;
                    self.INTERSECTED.currentHex = self.INTERSECTED.material.emissive.getHex();
                    self.INTERSECTED.material.emissive.setHex(0xff0000);
    
                    console.log(self.INTERSECTED.elemid)
    
                    //elemInfo=document.createElement("p")
                    //elemText = document.createTextNode("Element with ID: " + INTERSECTED.elemid);
                    //elemInfo.appendChild(elemText)
    
                    //containerSide.appendChild( elemInfo )
    
                }
    
            } else {
    
                if (self.INTERSECTED) self.INTERSECTED.material.emissive.setHex(self.INTERSECTED.currentHex);
    
                self.INTERSECTED = null;
    
            }
        }

        
    }

    getMousePosition(eventPos)
    {

        if (this.CANVAS)
        {
            var cvBR = this.CANVAS.getBoundingClientRect();
            return new THREE.Vector2(eventPos.x-cvBR.left, eventPos.y-cvBR.top);

        } else {
            return new THREE.Vector2(0,0);
        }

    }

    onMouseMove(event) {

        event.preventDefault();

        var mousePos = new THREE.Vector2(event.clientX, event.clientY);
        mousePos = this.getMousePosition(mousePos);

        this.MOUSE = new THREE.Vector2(( mousePos.x / this.state.width ) * 2 - 1, - ( mousePos.y / this.state.height ) * 2 + 1);
        //this.MOUSE = new THREE.Vector2(( mousePos.x / window.innerWidth ) * 2 - 1, - ( mousePos.y / window.innerHeight ) * 2 + 1);

        //console.log(this.MOUSE);
    }


    render() {

        var self = this;
        return (

            <WebGLRenderer key = "nq"
            deferred = {
                false
            }
            physicallyCorrectLights = {
                true
            }
            gammaInput = {
                true
            }
            gammaOutput = {
                true
            }
            shadowMap = {
                {
                    enabled: true
                }
            }
            toneMapping = {
                THREE.ReinhardToneMapping
            }
            antialias = {
                true
            }
            bgColor = {
                0xafafaf
            }
            setPixelRatio = {
                window.devicePixelRatio
            }
            setSize = {
                [this.state.width, this.state.height]
            }
            controls = {
                this.state.glControls
            }
            camera = {
                this.state.glCamera
            }
            scene = {
                new THREE.Scene()
            }
            onMount = {
                (objs) => this.initRendering(objs)
            }
            onAnimate = {
                (objs) => this.onRender(objs)
            }
            onMouseMove = {
                (evt) => this.onMouseMove(evt)
            }
            >

            <AmbientLight/>
            {
                self.state.globject
            }

            </WebGLRenderer>

        )
    }
}