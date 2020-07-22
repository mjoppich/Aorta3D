import * as React from 'react'; 
import {Card, CardActions, CardContent, CardHeader, CardText} from 'material-ui/Card';
import FlatButton from 'material-ui/FlatButton';

import Aorta3DRenderer from "../components/Aorta3DRenderer";
import Aorta3DElemInfos from "../components/Aorta3DElemInfos";
import Aorta3DRelatedExpsViewer from "../components/Aorta3DRelatedExpsViewer";
import Aorta3DExpAnalyser from "../components/Aorta3DExpAnalyser";

import Grid, { GridSpacing } from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import { json } from 'body-parser';


export interface ExplorePageProps { switchTab?: any };
export interface ExplorePageState { selected_element: any, selected_element_exp: any, selected_gene: any};

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
        this.setState({selected_element: {}, selected_element_exp: null, selected_gene: null})
    }



    handleElementSelected(element)
    {
        console.log("received element")
        console.log(element)
        this.setState({selected_element: element})
    }

    handleExpDetailSelected(element)
    {
        console.log("Element details selected")
        console.log(element)
        this.setState({selected_element_exp: element})
    }
    handleSelectedGene(element)
    {
        console.log("Gene selected")
        console.log(element)
        this.setState({selected_gene: element})
        if (element.size != 0){
            this.render()
        }
    }

    /**
     * Render the component.
     */
    render() {

        var self=this;

        console.log("render")
        console.log(this.state)

        var pageHeight = 600;


        // new THREE.PerspectiveCamera(45, 2, 0.1, 1000)

        // backgroundColor: "#FF0000", backgroundColor: "#00FF00", backgroundColor: "#0000FF", backgroundColor: "#FF00FF"

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

                        <Grid container
                            direction="column"
                            justify="space-between"
                            alignItems="flex-start"
                            spacing={(2) as GridSpacing}
                            style={{width: "100%", height: "100%"}}>
                            <Grid item xs style={{width: "100%"}}>
                                <Aorta3DRenderer width={600} height={pageHeight} onSelectElement={(element) => this.handleElementSelected(element)}/>
                            </Grid>
                            <Grid item xs style={{width: "100%", backgroundColor: "#00FF00"}}>
                                <Aorta3DElemInfos element={this.state.selected_element} onSelectElement={(element) => this.handleElementSelected(element)} onSelectGene={(rowData) => self.handleSelectedGene(rowData)} />
                            </Grid>
                            <Grid item xs style={{width: "100%", backgroundColor: "#0000FF"}}>
                                <Aorta3DRelatedExpsViewer element={this.state.selected_element} onSelectElement={(elem) => this.handleExpDetailSelected(elem)} onSelectGene={this.state.selected_gene}/>
                            </Grid>
                            <Grid item xs style={{width: "100%", backgroundColor: "#FF00FF"}}> 
                                <Aorta3DElemInfos element={this.state.selected_element_exp} onSelectElement={(element) => this.handleElementSelected(element)} onSelectGene={(rowData) => self.handleSelectedGene(rowData)} />
                            </Grid>
                        </Grid>
                    </CardText>

                </Card>

            </div>

        );
    }

}
