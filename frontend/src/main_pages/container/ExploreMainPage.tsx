import * as React from 'react'; 
import {Card, CardActions, CardContent, CardHeader, CardText} from 'material-ui/Card';
import FlatButton from 'material-ui/FlatButton';

import * as THREE from 'three';
import {WebGLRenderer, PointLight, AmbientLight, Mesh} from 'threact';

export interface ExplorePageProps { switchTab?: any };
export interface ExplorePageState { globject: any};

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

        this.setState({globject: []});

    }

    componentDidMount() {

    }

    newQuery()
    {
        //this.allQueries.push(<QueryComponent key={this.allQueries.length}/>);
        //this.setState({queriesStored: this.allQueries.length});

        
        var globject = [
        <WebGLRenderer key="nq"
            deferred={false}
            physicallyCorrectLights={true}
            gammaInput={true}
            gammaOutput={true}
            shadowMap={{enabled: true}}
            toneMapping={THREE.ReinhardToneMapping}
            antialias={true}
            bgColor={0x00a1ff}
            setPixelRatio={window.devicePixelRatio}
            setSize={[800,400]}
            camera={new THREE.PerspectiveCamera(75, 800/400, 0.1, 1000)}
            scene={new THREE.Scene()}>

        <AmbientLight />
        <Mesh
        geometry={new THREE.PlaneBufferGeometry( 20, 20 )}
        material={new THREE.MeshStandardMaterial({
          roughness: 0.8,
          color: 0x00ff00 ,
          metalness: 0.2,
          bumpScale: 0.0005
        })}
        rotation={[-Math.PI / 2.0 , 0, 0]}
        position={[10,0, 10]}
        />
    
        <Mesh
        geometry={new THREE.SphereGeometry( 1.0, 32, 32 )}
        material={new THREE.MeshStandardMaterial({
          color: 0xff0000 ,
          roughness: 0.5,
          metalness: 1.0
        })}
        position={[0,2,0]}
        rotation={[0, 0, 0]}
        castShadow={true} />

            </WebGLRenderer>
            ];
    
    
            this.setState({globject: globject});
    }

    clearQueries()
    {
        //this.allQueries = [];
        //this.setState({queriesStored: this.allQueries.length});
    }

    /**
     * Render the component.
     */
    render() {


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

                    <CardText style={{innerHeight: "200px"}}>

                        {this.state.globject}

                    </CardText>

                </Card>
                
                <div>
                    
                </div>

            </div>

        );
    }

}
