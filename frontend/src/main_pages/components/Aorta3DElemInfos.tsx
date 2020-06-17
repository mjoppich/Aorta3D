import * as React from 'react';

import ChipInput from 'material-ui-chip-input';
import AutoComplete from 'material-ui/AutoComplete';
import axios from 'axios';
import config from '../config';
import Grid, { GridSpacing } from '@material-ui/core/Grid';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';

import Aorta3DClickableMap from '../components/Aorta3DClickableMap';
import Aorta3DDEResViewer from '../components/Aorta3DDEResViewer';

export interface Aorta3DElemInfosProps {
    onSelectElement?: any
    element?: any
};
export interface Aorta3DElemInfosState {
    eleminfo: any,
    element: any,
    elem_image: any,
    selected_region: any
};



export default class Aorta3DElemInfos extends React.Component < Aorta3DElemInfosProps, Aorta3DElemInfosState > {

    neo4jd3: any = null;

    state = {
        element: {id: null},
        eleminfo: null,
        elem_image: "",
        selected_region: null
    }

    constructor(props) {
        super(props);
    }

    public static defaultProps: Partial < Aorta3DElemInfosProps > = {
    };



    isFunction(functionToCheck) {
        return functionToCheck && {}.toString.call(functionToCheck) === '[object Function]';
    }

    setElemInfo(info)
    {
        var self=this;
        self.setState({eleminfo: info})

    }

    componentDidUpdate(prevProps, prevState, snapshot)
    {
        var self=this;

        if (prevProps.element !== this.props.element)
        {
            self.setState({element: this.props.element});
        }

        if ((prevState.element == null) || (prevState.element.id !== self.state.element.id)|| (prevState.element.id !== self.state.element.id))
        {
            console.log(prevState.element)
            console.log(self.state.element)

            if (self.state.element.id)
            {
                console.log("Fetching element info and image")
                console.log(self.state.element.id)

                axios.post(config.getRestAddress() + "/getElement", {id: self.state.element.id}, config.axiosConfig)
                .then(function (response) {
        
                  self.setElemInfo(response.data);
        
        
                })
                .catch(function (error) {
    
                });
        
                axios.post(config.getRestAddress() + "/getElementImage", {id: self.state.element.id}, config.axiosConfig)
                .then(function (response) {

                    console.log(response)

                    self.setState({elem_image: response.data.image})
        
        
                })
                .catch(function (error) {
    
                });
            }
            
        }



    }


    handleSelectedRegionChange( newRegion )
    {
        console.log("new region selected")
        console.log(newRegion)

        this.setState({selected_region: newRegion})
    }


    render() {

        var self=this;

        var isMSI = (self.state!= null) && (self.state.eleminfo != null) && (["msi"].indexOf(self.state.eleminfo["type"]) >= 0)
        var isScheme = (self.state!= null) && (self.state.eleminfo != null) && (["scheme"].indexOf(self.state.eleminfo["type"]) >= 0)
        var isSCRNASeq = (self.state!= null) && (self.state.eleminfo != null) && (["scrna"].indexOf(self.state.eleminfo["type"]) >= 0)

        console.log("Is this msi " + isMSI);
        console.log("Is this scheme " + isScheme);
        console.log("Is this scrna " + isSCRNASeq);
        console.log(self.state)
        console.log(self.state.eleminfo)

        var detailElement = [];
        var extraElements = [];
        //{ "id": "scheme_config.json:0", "type": "scheme", "type_det": [ "no" ], "color": "#f0ff00", "right": 0, "path": "model/no_plaque_slide/no_plaque.stl", "png_path": "data/models/no_plaque_slide/no_plaque.small.png", "info_path": "data/models/no_plaque_slide/no_plaque.info" 

        var rows = []

        if (self.state.eleminfo)
        {
            rows.push({key: "Element ID", value: self.state.eleminfo.id})
            rows.push({key: "Element Type", value: self.state.eleminfo.type})
            rows.push({key: "Aorta Types", value: self.state.eleminfo.type_det.join(", ")})
        }

        detailElement.push(
            <Grid item xs key={detailElement.length} style={{width: "400px"}}>
                <TableContainer component={Paper} >
                    <Table aria-label="Element Info">
                        <TableHead>
                        <TableRow>
                            <TableCell component="th" scope="row">Key</TableCell>
                            <TableCell align="right">Value</TableCell>
                        </TableRow>
                        </TableHead>
                        <TableBody>
                        {rows.map((row) => (
                            <TableRow key={row.name}>
                            <TableCell component="th" scope="row">{row.key}</TableCell>
                            <TableCell align="right">{row.value}</TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Grid>
        )

        if (isScheme)
        {
            detailElement.push(
                <Grid item xs key={detailElement.length}><Aorta3DClickableMap element={self.state.eleminfo} onSelectRegion={(regionInfo) => self.handleSelectedRegionChange(regionInfo)} /></Grid>
            )
        } else if (isMSI)
        {
            detailElement.push(
                <Grid item xs key={detailElement.length}><Aorta3DClickableMap element={self.state.eleminfo} onSelectRegion={(regionInfo) => self.handleSelectedRegionChange(regionInfo)} /></Grid>)
            extraElements.push(
                <Aorta3DDEResViewer key={extraElements.length} element={self.state.selected_region} exp_type={self.state.eleminfo["type"]} />
                )

        } else if (isSCRNASeq) {
            extraElements.push(<Aorta3DDEResViewer element={self.state.eleminfo} exp_type={self.state.eleminfo["type"]}/>)
        } else {
            detailElement.push(<Grid item xs key={detailElement.length}><img style={{maxHeight: "200px", maxWidth: "400px"}} src={`data:image/png;base64,${self.state["elem_image"]}`} /></Grid>)
        }

        var self = this;


        return (
                <div>
                    <Grid container
                        direction="row"
                        justify="space-between"
                        alignItems="flex-start"
                        spacing={(2) as GridSpacing}
                        style={{width: "100%", height: "450px"}}>
                        {detailElement}
                    </Grid>
                    {extraElements}
                </div>
        )
    }
}