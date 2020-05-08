import * as React from "react"; 
import { Card, CardTitle, CardText } from 'material-ui/Card';
import { Button } from "../../../node_modules/@material-ui/core";
import ActionExplore from 'material-ui/svg-icons/action/explore';

import axios from 'axios';
import config from '../config';

export interface MainStatusProps { };
export interface MainStatusState { stats: any};

export class MainStatus extends React.Component<MainStatusProps,MainStatusState> {

    /**
     * Class constructor.
     */
    constructor(props) {
        super(props);

    }

    componentWillMount()
    {
        this.setState({stats: {}});
    }

    /**
     * This method will be executed after initial rendering.
     */
    componentDidMount() {

        var self=this;

        axios.post(config.getRestAddress() + "/stats", {}, config.axiosConfig)
        .then(function (response) {


          console.log(response.data)

          self.setState({stats: response.data})

        })
        .catch(function (error) {
          console.log(error)
          self.setState({stats: {}})
        });

    }

    render() {

        var self=this;


        return (
            <div>
                <span>
                    <h4>Aorta3D</h4>
                    <p>
                        This section may give you some information about the project.
                    </p>
                </span>
                <span>
                    <h4>Statistics</h4>
                    <ul>
                        <li><b>Datasets</b>: {this.state.stats.datasets || 0}</li>
                        <li><b>Data Types included</b>: {(this.state.stats.datatypes || []).join(", ")}</li>
                        
                    </ul>
                </span>
               

            </div>
        );
    }

}


export class WelcomePage extends React.Component<{ switchTab?: any },{}> {

    /**
     * Class constructor.
     */
    constructor(props) {
        super(props);

    }

    

    /**
     * This method will be executed after initial rendering.
     */
    componentDidMount() {

    }

    /**
     * Render the component.
     */
    render() {


        return (

            <div>
            <Card style={{marginBottom: "20px"}}>
                <CardTitle
                    title="Aorta3D"
                    subtitle="check out your Aorta in 3D"
                />
                <CardText >
                    <p>Explore the database in the explore tab.</p>
                    <p>Go to <Button onClick={() => this.props.switchTab(1)}> <ActionExplore/> Explore</Button> tab.</p>
                </CardText>
            </Card>
            <Card style={{marginBottom: "20px"}}>
                        <CardText >
                            <MainStatus/>
                        </CardText>
                    </Card>

            <Card style={{marginBottom: "20px"}}>
                <CardTitle
                    title="Data Privacy"
                />
                <CardText >
                    <p>You can find the data privacy guide-lines <a target="_blank" href="https://www.bio.ifi.lmu.de/funktionen/datenschutz/index.html">here</a>.</p>
                    <p>Your IP address might be stored by the web server. All log files are deleted after 7 days.</p>
                </CardText>
            </Card>
            </div>

        );
    }

}