import * as React from 'react'; 
import {Card, CardActions, CardContent, CardHeader, CardText} from 'material-ui/Card';
import FlatButton from 'material-ui/FlatButton';

import * as THREE from 'three';
var STLLoader = require('three-stl-loader')(THREE)

import {WebGLRenderer, PointLight, AmbientLight, Mesh} from 'threact';
import config from '../config';
import { listenerCount } from 'cluster';

var createCamera = require('perspective-camera')




export interface ExplorePageProps { switchTab?: any };
export interface ExplorePageState { globject: any, glScene: any, glCamera: any, glControls: any, width: any, height: any};

export class ExploreMainPage extends React.Component<ExplorePageProps, ExplorePageState> {

    allQueries = [];
    /**
     * Class constructor.
     */
    constructor(props) {
        super(props);
    }

    /**
     * This method will be executed after initial rendering.
     */
    componentWillMount() {
        var self=this;

        var width = 1200;
        var height = 800;

        var cameraXOffset = 50;

        var camera = new THREE.PerspectiveCamera(75, width/height, 0.1, 1000)
        camera.position.set(cameraXOffset,0,0);        
        camera.lookAt([0,0,0])
        camera.updateProjectionMatrix();

        var controls = require('orbit-controls')({position: [cameraXOffset,0,0]});
        controls.test = "test";

        this.setState({globject: [], glCamera: camera, glControls: controls, width: width, height: height});
    }

    loadBaseElement(loader, elempath, mpos=[0, 0, 0], mscale=[1,1,1], mcolor="#ffffff", mrot=[0,0,0])
    {
        var self=this;

        loader.load( config.getRestAddress() + "/"+elempath, function ( geometry ) {

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

            var nmesh = <Mesh key={curlist.length}
            geometry={geometry}
            material={new THREE.MeshStandardMaterial({
              color: mcolor
            })}
            scale={mscale}
            position={mpos}
            />;
            
            curlist.push(nmesh);

            self.setState({globject: curlist})
        } );
    }

    componentDidMount() {


        var self=this;
        var loader = new STLLoader();

        var scaleFactor = 0.1;

        self.loadBaseElement(loader, "model/base/membrane1.stl", [0, 0, 0], [scaleFactor,scaleFactor,scaleFactor], "#ff0000", [0,-Math.PI/2,0]);
        self.loadBaseElement(loader, "model/base/membrane2.stl", [0, 0, 0], [scaleFactor,scaleFactor,scaleFactor], "#00ff00", [0,-Math.PI/2,0]);
        self.loadBaseElement(loader, "model/base/membrane3.stl", [0, 0, 0], [scaleFactor,scaleFactor,scaleFactor], "#0000ff", [0,-Math.PI/2,0]);

        self.loadBaseElement(loader, "model/base/plaque.stl", [0, 0, 0], [scaleFactor,scaleFactor,scaleFactor], "#ff0000", [0,-Math.PI/2,0]);
        self.loadBaseElement(loader, "model/base/macrophage.stl", [0, 0, 0], [scaleFactor,scaleFactor,scaleFactor], "#ff0000", [0,-Math.PI/2,0]);
        self.loadBaseElement(loader, "model/base/plaque.stl", [0, 0, 0], [scaleFactor,scaleFactor,scaleFactor], "#ff0000", [0,-Math.PI/2,0]);

    }

    newQuery()
    {
        //this.allQueries.push(<QueryComponent key={this.allQueries.length}/>);
        //this.setState({queriesStored: this.allQueries.length});
        var self=this;

    }

    clearQueries()
    {
        //this.allQueries = [];
        //this.setState({queriesStored: this.allQueries.length});
    }

    initRendering(objs)
    {
        console.log("init render")
        console.log(objs)

        objs.scene.background = new THREE.Color( 0xf0f0f0 );
        objs.target = new THREE.Vector3(0,0,0);

        console.log(objs)

        return objs;
    }

    /**
     * Render the component.
     */
    render() {

        var self=this;


        // new THREE.PerspectiveCamera(45, 2, 0.1, 1000)


        return (

            <div>

                <Card style={{marginBottom: "20px"}}>
                    <CardHeader
                    title="Explore Aorta3D"
                    subtitle="Explore your model"
                    />
                    <CardText>

                        <p>Using a query you can query our database for data.</p>

                    </CardText>
                </Card>

                <Card style={{marginBottom: "20px"}}>
                    <CardHeader
                    title="Aorta3D"
                    subtitle=""
                    />
                    <CardActions>
                    <FlatButton label="Move" onClick={this.newQuery.bind(this)}/>
                    <FlatButton label="Select" onClick={this.clearQueries.bind(this)}/>
                    </CardActions>

                    <CardText>


                    <WebGLRenderer key="nq"
                        deferred={false}
                        physicallyCorrectLights={true}
                        gammaInput={true}
                        gammaOutput={true}
                        shadowMap={{enabled: true}}
                        toneMapping={THREE.ReinhardToneMapping}
                        antialias={true}
                        bgColor={0xafafaf}
                        setPixelRatio={window.devicePixelRatio}
                        setSize={[this.state.width, this.state.height]}
                        controls={this.state.glControls}
                        camera={this.state.glCamera}
                        scene={new THREE.Scene()}
                        onMount={(objs) => this.initRendering(objs)}
                        >

                            <AmbientLight />
                            {self.state.globject}

                        </WebGLRenderer>

                    </CardText>

                </Card>
                
                <div>
                    
                </div>

            </div>

        );
    }

}
