import * as React from 'react'; 
import {Card, CardActions, CardContent, CardHeader, CardText} from 'material-ui/Card';
import FlatButton from 'material-ui/FlatButton';

import Aorta3DRenderer from "../components/Aorta3DRenderer";





export interface ExplorePageProps { switchTab?: any };
export interface ExplorePageState { };

export class ExploreMainPage extends React.Component<ExplorePageProps, ExplorePageState> {

    allQueries = [];
    /**
     * Class constructor.
     */
    constructor(props) {
        super(props);
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

                    </CardActions>

                    <CardText>

                        <Aorta3DRenderer width={1200} height={800}/>


                    </CardText>

                </Card>
                
                <div>
                    
                </div>

            </div>

        );
    }

}
