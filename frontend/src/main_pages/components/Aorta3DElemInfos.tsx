import * as React from 'react';

import ChipInput from 'material-ui-chip-input';
import AutoComplete from 'material-ui/AutoComplete';
import axios from 'axios';
import config from '../config';

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
        eleminfo: {},
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

        var detailElement = null;
        var self=this;

        var isMSI = (self.state!= null) && (self.state.eleminfo != null) && (["msi"].indexOf(self.state.eleminfo["type"]) >= 0)
        var isSCRNASeq = (self.state!= null) && (self.state.eleminfo != null) && (["scrna"].indexOf(self.state.eleminfo["type"]) >= 0)

        console.log("Is this MSI " + isMSI);
        console.log(["msi"].indexOf(self.state.eleminfo["type"]) >= 0)
        console.log(self.state)
        console.log(self.state.eleminfo)
        if (isMSI)
        {
            detailElement = [
                    <Aorta3DClickableMap key="0" element={self.state.eleminfo} onSelectRegion={(regionInfo) => self.handleSelectedRegionChange(regionInfo)} />,
                    <Aorta3DDEResViewer key="1" element={self.state.selected_region} exp_type={self.state.eleminfo["type"]} />,
            ]
        } else if (isSCRNASeq) {
            detailElement = [<Aorta3DDEResViewer key="1" element={self.state.eleminfo} exp_type={self.state.eleminfo["type"]}/>]
        } else {
            detailElement = <img style={{maxWidth: "400px"}} src={`data:image/png;base64,${self.state["elem_image"]}`} />
        }

        var self = this;
        return (
            <div>
                <p>{JSON.stringify(self.state.element, null, 4)}</p>
                <p>{JSON.stringify(self.state.eleminfo, null, 4)}</p>
                {detailElement}
            </div>
        )
    }
}