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
    AmbientLight, HemisphereLight,
    Mesh
} from 'threact';
import {
    listenerCount
} from 'cluster';

var createCamera = require('perspective-camera')

export interface Aorta3DRendererProps {
    width?: number,
    height?: number,
    onSelectElement?: any
};
export interface Aorta3DRendererState {
    globject: any,
    glScene: any,
    glCamera: any,
    glControls: any,
    glRaycaster:any
};



export default class Aorta3DRenderer extends React.Component < Aorta3DRendererProps, Aorta3DRendererState > {

    glrendererdiv: any;
    glrendercomponent: any;

    constructor(props) {
        super(props);

        this.glrendererdiv = React.createRef();
        this.glrendercomponent = [];
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

    isFunction(functionToCheck) {
        return functionToCheck && {}.toString.call(functionToCheck) === '[object Function]';
    }


    loadBaseElement(loader, elemID, mpos = [0, 0, 0], mscale = [1, 1, 1], mcolor = "#ffffff", mselcolor = "#ffffff", mrot = [0, 0, 0], elemData=null) {
        var self = this;

        axios.post(config.getRestAddress() + "/get_model", {id: elemID}, config.axiosConfig)
        .then(function (response:any) {

            console.log("loading stl")
            console.log(elemID)

            var modelDescr = atob(response.data.model);

            //loader.load(config.getRestAddress() + "/" + elempath, function (geometry) {
            var geometry = loader.parse(modelDescr)
            {

                console.log("got geometry")

                geometry.computeBoundingBox();
                geometry.center()
    
                console.log(geometry)
                //var geomSize = {x: geometry.boundingBox.max.x-geometry.boundingBox.min.x, y: geometry.boundingBox.max.y-geometry.boundingBox.min.y, z: geometry.boundingBox.max.z-geometry.boundingBox.min.z}
                //mpos = [-geomSize.x*mscale[0]/2.0 + mpos[0], -geomSize.y*mscale[1]/2.0 + mpos[1], -geomSize.z*mscale[2]/2.0 + mpos[2]]
    

                console.log(geometry.boundingBox)
    
                var curlist = self.state.globject;
    
                var nmesh = < Mesh key = {
                    curlist.length
                }
                geometry = {
                    geometry
                }
                selcolor={mselcolor}
                material = {
                    new THREE.MeshStandardMaterial({
                        color: mcolor,
                        metalness: 0
                    })
                }
                selected_material = {
                    new THREE.MeshStandardMaterial({
                        color: mselcolor,
                        metalness: 0
                    })
                }
                normal_material = {
                    new THREE.MeshStandardMaterial({
                        color: mcolor,
                        metalness: 0
                    })
                }
                scale = {
                    mscale
                }
                position = {
                    mpos
                }
                elemInfo = {
                    elemData
                }
                rotation = {
                    mrot
                }
                />;
    
                curlist.push(nmesh);
    
                self.setState({
                    globject: curlist
                })
            }


        })


    }

    componentDidUpdate() {

        var self=this;
        console.log("did update")
        console.log(self.state)
    
    }

    componentDidMount() {


        var self = this;

        console.log("in component did mount")

        // BELOW WAS COMPONENT WILL MOUNT

        var width = this.props.width;
        var height = this.props.height;

        var cameraXOffset = 50;

        var camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
        camera.position.set(cameraXOffset, 0, 0);
        camera.lookAt([0, 0, 0])
        camera.updateProjectionMatrix();

        var raycaster = new THREE.Raycaster();
        console.log("orbit controls")
        console.log(this.glrendererdiv.current)

        var controls = require('orbit-controls')({
            position: [50, 0, 0],
            parent: this.glrendererdiv.current,
            element: this.glrendererdiv.current
        });

        this.setState({
            globject: [],
            glCamera: camera,
            glControls: controls,
            glRaycaster: raycaster
        });

        // ABOVE WAS COMPONENT WILL MOUNT

        var loader = new STLLoader();

        var scaleFactor = 0.5;//0.1;
        var scaleFactor2 = 2.7;//3;

        //self.loadBaseElement(loader, "model/base/membrane1.small.stl", [0, 0, 0], [scaleFactor, scaleFactor, scaleFactor], "#ffffff", [0, 0, 0], {id: "config.json:mem1", descr: "Membrane 1", type_det: ["endothelial"]});
        //self.loadBaseElement(loader, "model/base/membrane2.small.stl", [0, 0, 0], [scaleFactor, scaleFactor, scaleFactor], "#9f9f9f", [0, 0, 0], {id: "config.json:mem2", descr: "Membrane 2", type_det: ["endothelial"]});
        //self.loadBaseElement(loader, "model/base/membrane3.small.stl", [0, -1.7, 0], [scaleFactor, scaleFactor, scaleFactor], "#009900", [0, 0, 0], {id: "config.json:mem3", descr: "Membrane 3", type_det: ["endothelial"]});
        //self.loadBaseElement(loader, "model/base/plaque.small.stl", [0, 0, 0], [scaleFactor, scaleFactor, scaleFactor], "#ff0000", [0, 0, 0], {id: "config.json:plq", descr: "Plaque", type_det: ["plaque"]});
        //self.loadBaseElement(loader, "model/base/macrophage.small.stl", [0, 0, 0], [scaleFactor, scaleFactor, scaleFactor], "#ffff00", [0, 0, 0], {id: "config.json:mac", descr: "Macrophage", type_det: ["macrophage"]});

        axios.post(config.getRestAddress() + "/fetchViewableData", {}, config.axiosConfig)
        .then(function (response) {

            var bbox = response.data.bbox;

            var yStretch = bbox.y[1]-bbox.y[0]
            var stepSize = yStretch / 100;
        
          response.data.data.forEach(element => {

            if (element.bg_elem)
            {
                self.loadBaseElement(loader, element.id, [0, 0, 0], [scaleFactor, scaleFactor, scaleFactor], element.color, element.selected_color || element.color , [0, 0, 0], element);
            } else {
                var elemLevel = element.level || 50;
                // display stacked
                self.loadBaseElement(loader, element.id, [1, bbox.y[0]+elemLevel*stepSize, 0], [scaleFactor/scaleFactor2, scaleFactor/scaleFactor2, scaleFactor/scaleFactor2], element.color, element.selected_color || element.color, [Math.PI / 2, element.right * Math.PI, 0], {id: element.id, descr: element.type});

            }
          });  

        })
        .catch(function (error) {
          console.log(error)
        });


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
    
                    if (self.INTERSECTED)
                    {
                        self.INTERSECTED.material.emissive.setHex(self.INTERSECTED.currentHex);
                    }
    
                    self.INTERSECTED = intersects[0].object;
                    

                    self.INTERSECTED.currentHex = self.INTERSECTED.material.emissive.getHex();
                    self.INTERSECTED.material.emissive.setHex(0xffffff);
                    console.log(self.INTERSECTED)
                       
                    if (self.isFunction(self.props.onSelectElement))
                    {
                        self.props.onSelectElement(self.INTERSECTED.elemInfo)
                    } else {
                    }
    
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

        //event.preventDefault();
        event.stopPropagation();

        var mousePos = new THREE.Vector2(event.clientX, event.clientY);
        mousePos = this.getMousePosition(mousePos);

        this.MOUSE = new THREE.Vector2(( mousePos.x / this.props.width ) * 2 - 1, - ( mousePos.y / this.props.height ) * 2 + 1);
        //this.MOUSE = new THREE.Vector2(( mousePos.x / window.innerWidth ) * 2 - 1, - ( mousePos.y / window.innerHeight ) * 2 + 1);

        //console.log(this.MOUSE);
    }


    render() {

        var self = this;

        var glrendercomponent = [];


        if (this.state != null)
        {
            var cameraUnset = this.state.glCamera === null;
            var controlsUnset = this.state.glControls === null;
            var raycasterUnset = this.state.glRaycaster === null;
            var sceneUnset = this.state.glScene === null;
    
            console.log("render")
            console.log("Camera unset " + cameraUnset)
            console.log("controls unset " + controlsUnset)
            console.log("ray unset " + raycasterUnset)
            console.log("scene unset " + sceneUnset)
            
            var allUnset = cameraUnset || controlsUnset || raycasterUnset || sceneUnset;
            
    
            if (!allUnset)
            {
                console.log("updating render component")
    
                glrendercomponent.push(
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
                        [this.props.width, this.props.height]
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

                    <HemisphereLight
                    skyColor={0xddeeff}
                    groundColor={0x0f0e0d}/>
    
                
                    {
                        self.state.globject
                    }
    
                    </WebGLRenderer>
                        )
            }
        }

        



        return (
            <div ref={this.glrendererdiv}>
                {glrendercomponent}
            </div>

        )
    }
}