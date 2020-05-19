import * as React from 'react';

import ChipInput from 'material-ui-chip-input'
import AutoComplete from 'material-ui/AutoComplete'
import axios from 'axios';
import config from '../config';


export interface Aorta3DElemInfosProps {
    onSelectElement?: any
    element?: any
};
export interface Aorta3DElemInfosState {
    eleminfo: any,
    element: any,
    elem_image: any
};



export default class Aorta3DElemInfos extends React.Component < Aorta3DElemInfosProps, Aorta3DElemInfosState > {

    neo4jd3: any = null;

    state = {
        element: {id: null},
        eleminfo: {},
        elem_image: ""
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

                axios.post(config.getRestAddress() + "/getElementInfo", {id: self.state.element.id}, config.axiosConfig)
                .then(function (response) {
        
                  self.setElemInfo(response.data);
        
        
                })
                .catch(function (error) {
    
                });
        
                axios.post(config.getRestAddress() + "/getElementInfoImage", {id: self.state.element.id}, config.axiosConfig)
                .then(function (response) {

                    console.log(response)

                    self.setState({elem_image: response.data.image})
        
        
                })
                .catch(function (error) {
    
                });
            }
            
        }



    }

    render() {

        var self = this;
        return (
            <div>
                <p>{JSON.stringify(self.state.element, null, 4)}</p>
                <p>{JSON.stringify(self.state.eleminfo, null, 4)}</p>
                <img src={`data:image/png;base64,${self.state["elem_image"]}`} />
            </div>
        )
    }
}