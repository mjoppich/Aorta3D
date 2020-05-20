import * as React from 'react';

import ChipInput from 'material-ui-chip-input'
import AutoComplete from 'material-ui/AutoComplete'
import axios from 'axios';
import config from '../config';

import MaterialTable from 'material-table';
import { type } from 'os';


export interface Aorta3DRelatedExpsViewerProps {
    onSelectElement?: any,
    element?: any
};
export interface Aorta3DRelatedExpsViewerState {
    relatedexps: any,
    element: any,
};


export default class Aorta3DRelatedExpsViewer extends React.Component < Aorta3DRelatedExpsViewerProps, Aorta3DRelatedExpsViewerState>
{

    neo4jd3: any = null;

    state = {
        relatedexps: [
            {
                "id": 415,
                "type": "msi",
                "type_det": "Lipids",
                "region": "0",
                "location": "AR",
                "path": "/usr/local/hdd/rita/msimaging/190927_AR_ZT13_Lipids/190927_AR_ZT13_Lipids.imzML",
                "info_path": "/usr/local/hdd/rita/msimaging/190927_AR_ZT13_Lipids/190927_AR_ZT13_Lipids.imzML.info",
                "level": 50
            },
            {
                "id": 417,
                "type": "msi",
                "type_det": "Lipids",
                "region": "5",
                "location": "AR",
                "path": "/usr/local/hdd/rita/msimaging/190927_AR_ZT13_Lipids/190927_AR_ZT13_Lipids.imzML",
                "info_path": "/usr/local/hdd/rita/msimaging/190927_AR_ZT13_Lipids/190927_AR_ZT13_Lipids.imzML.info",
                "level": 50
            },
        ],
        element: null
    }

    constructor(props) {
        super(props);
    }

    public static defaultProps: Partial < Aorta3DRelatedExpsViewerProps > = {
    };



    isFunction(functionToCheck) {
        return functionToCheck && {}.toString.call(functionToCheck) === '[object Function]';
    }

    setRelatedExps(info)
    {
        var self=this;
        self.setState({relatedexps: info})

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
                console.log("Fetching related data")
                console.log(self.state.element.id)
        
                axios.post(config.getRestAddress() + "/getRelatedData", {id: self.state.element.id}, config.axiosConfig)
                .then(function (response) {
                    self.setState({relatedexps: response.data})    
                })
                .catch(function (error) {
    
                });
            }
            
        }
    }

    static getDerivedStateFromProps(nextProps, prevState){

        var self = this;

        if ((prevState == null) || (nextProps.element!==prevState.element)){            
            return {element: nextProps.element}
        }
        else return null;
      }

    componentDidMount() {

       
    }


    render() {
        //customFilterAndSearch: (term, rowData) => term == rowData.name.length

        var self = this;
        return (
            <MaterialTable
            title="Related Experiments"
            columns={[
              { title: 'Experiment ID', field: 'id', type: 'numeric' },
              { title: 'Exp-Type', field: 'type' },
              { title: 'Detail Type', field: 'type_det', render: rowData => Array.isArray(rowData.type_det) ? <div>{rowData.type_det.join("; ")}</div> : <div>{rowData.type_det}</div>},
              { title: 'Sample Location', field: 'location' },
              { title: 'Plaque Level', field: 'level' },
              { title: "Plaque Rate", field: "plaqueRate", type: "numeric"}
            ]}
            data={self.state.relatedexps}
            options={{
              filtering: true
            }}
          />
        )
    }
}