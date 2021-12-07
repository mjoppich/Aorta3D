import * as React from 'react';

import ChipInput from 'material-ui-chip-input'
import AutoComplete from 'material-ui/AutoComplete'
import axios from 'axios';
import config from '../config';
import FlatButton from 'material-ui/FlatButton';

import MaterialTable from 'material-table';
import { type } from 'os';

import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';
import FormGroup from '@material-ui/core/FormGroup';


export interface Aorta3DRelatedExpsViewerProps {
    onSelectElement?: any,
    onBlendedData?: any,
    element?: any,
    selectedGene?: any
};
export interface Aorta3DRelatedExpsViewerState {
    relatedexps: any,
    element: any,
};


export default class Aorta3DRelatedExpsViewer extends React.Component < Aorta3DRelatedExpsViewerProps, Aorta3DRelatedExpsViewerState>
{ 

    state = {
        relatedexps: [],
        element: null
    }

    constructor(props) {
        super(props);
    }

    public static defaultProps: Partial < Aorta3DRelatedExpsViewerProps > = {
    };

    getRowDetails(rowdata)
    {   
        if (this.isFunction(this.props.onSelectElement))
        {
            this.props.onSelectElement(rowdata);
        }

    }

    blendedids = [];


    blendedData(toggleElement)
    {   

        var elemPos = this.blendedids.indexOf(toggleElement);
        if (elemPos >= 0)
        {
            this.blendedids.splice(elemPos, 1)
        } else {
            this.blendedids.push(toggleElement)
        }
        console.log("Handling toggling %s", this.blendedids)

        if (this.isFunction(this.props.onBlendedData))
        {
            this.props.onBlendedData(this.blendedids);
        }

    }


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
        console.log("in related!!!!!")
        console.log(self.props.selectedGene)
        if (prevProps.element !== this.props.element)
        {
            self.setState({element: this.props.element});
        }
        
        if ((prevState.element == null) || (prevState.element.id !== self.state.element.id)|| (prevState.element.id !== self.state.element.id) || self.props.selectedGene !== prevProps.selectedGene)
        {
            
            console.log(prevState.element)
            console.log(self.state.element)

            if (self.state.element.id)
            {
                console.log("Fetching related data")
                if (self.props.selectedGene === null || self.props.selectedGene === undefined)
                {
                    axios.post(config.getRestAddress() + "/getRelatedData", {id: self.state.element.id}, config.axiosConfig)
                    .then(function (response) {
                        self.setState({relatedexps: response.data})    
                    })
                    .catch(function (error) {
        
                    });   
                }
                else
                {
                    axios.post(config.getRestAddress() + "/getGeneRelatedData", {id: self.state.element.id, gene:self.props.selectedGene}, config.axiosConfig)
                    .then(function (response) {
                        self.setState({relatedexps: response.data})    
                    })
                    .catch(function (error) {
        
                    });


                }
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
              { title: "Plaque Rate", field: "plaqueRate", type: "numeric"},
              { title: 'Blend', render: rowData => <FormGroup row><FormControlLabel control={<Switch onChange={() => {this.blendedData(rowData.id)}}/> } label=""/></FormGroup> },
              { title: 'Details', render: rowData => <FlatButton onClick={() => {this.getRowDetails(rowData)}}>Details</FlatButton> },
            ]}
            data={self.state.relatedexps}
            actions={[
                {
                  icon: 'save',
                  tooltip: 'Check Details',
                  onClick: (event, rowData) => self.isFunction(self.props.onSelectElement) ? self.props.onSelectElement(rowData) : function() {}
                }
              ]}
            options={{
              filtering: true,
              selection: true
            }}
            onSelectionChange={(rows) => alert('You selected ' + rows.length + ' rows')}
          />
        )
    }
}