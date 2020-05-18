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

    constructor(props) {
        super(props);
    }

    public static defaultProps: Partial < Aorta3DElemInfosProps > = {
    };



    isFunction(functionToCheck) {
        return functionToCheck && {}.toString.call(functionToCheck) === '[object Function]';
    }

    componentDidMount() {

       
    }

    setElemInfo(info)
    {
        var self=this;
        self.setState({eleminfo: info})

    }

    componentDidUpdate(prevProps, prevState, snapshot)
    {
        var self=this;

        axios.post(config.getRestAddress() + "/getElementInfo", {id: self.state.element.id}, config.axiosConfig)
        .then(function (response) {

          console.log(response.data)
          self.setElemInfo(response.data);


        })
        .catch(function (error) {
          console.log(error)
          self.setElemInfo({});
        });

        axios.post(config.getRestAddress() + "/getElementInfoImage", {id: self.state.element.id}, config.axiosConfig)
        .then(function (response) {

          console.log(response.data)
          self.setState({elem_image: response.data})


        })
        .catch(function (error) {
          console.log(error)
          self.setState({elem_image: ""})
        });

    }

    static getDerivedStateFromProps(nextProps, prevState){

        var self = this;

        if ((prevState == null) || (nextProps.element!==prevState.element)){            
            return {element: nextProps.element}
        }
        else return null;
      }


    render() {

        var self = this;
        return (
            <div>
                <p>{JSON.stringify(this.state.element, null, 4)}</p>
                <p>{JSON.stringify(this.state.eleminfo, null, 4)}</p>
                <img src={`data:image/jpeg;base64,${this.state.elem_image}`} />
            </div>
        )
    }
}