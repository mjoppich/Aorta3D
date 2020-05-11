import * as React from 'react'; 
import {Card, CardActions, CardContent, CardHeader, CardText} from 'material-ui/Card';
import FlatButton from 'material-ui/FlatButton';

import Aorta3DRenderer from "../components/Aorta3DRenderer";

import Grid, { GridSpacing } from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import { json } from 'body-parser';

export interface ExplorePageProps { switchTab?: any };
export interface ExplorePageState { selected_element: any};

export class ExploreMainPage extends React.Component<ExplorePageProps, ExplorePageState> {

    allQueries = [];
    /**
     * Class constructor.
     */
    constructor(props) {
        super(props);
    }

    componentWillMount()
    {
        this.setState({selected_element: {}})
    }



    handleElementSelected(element)
    {
        console.log("received element")
        console.log(element)
        this.setState({selected_element: element})
    }

    /**
     * Render the component.
     */
    render() {

        var self=this;

        console.log("render")
        console.log(this.state.selected_element)


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

                    <Grid   container
  direction="row"
  justify="space-between"
  alignItems="flex-start"
   spacing={(2) as GridSpacing}
   style={{width: "100%"}}>
                        <Grid item xs>
                            <Aorta3DRenderer width={600} height={600} onSelectElement={(element) => this.handleElementSelected(element)}/>
                        </Grid>
                        <Grid item xs>
                            <Paper style={{width: "100%"}}>
                                <p>Hello World</p>
                                <p>{JSON.stringify(this.state.selected_element, null, 4)}</p>
                            </Paper>
                        </Grid>
                    </Grid>



                    </CardText>

                </Card>
                
                <div>
                    
                </div>

            </div>

        );
    }

}
