import * as React from 'react';

import ChipInput from 'material-ui-chip-input'
import AutoComplete from 'material-ui/AutoComplete'
import axios from 'axios';
import config from '../config';


export interface Aorta3DRelatedExpsViewerProps {
    onSelectElement?: any
};
export interface Aorta3DRelatedExpsViewerState {
    eleminfo: any
};



export default class Aorta3DRelatedExpsViewer extends React.Component < Aorta3DRelatedExpsViewerProps, Aorta3DRelatedExpsViewerState>
{

    neo4jd3: any = null;

    constructor(props) {
        super(props);
    }

    public static defaultProps: Partial < Aorta3DRelatedExpsViewerProps > = {
    };



    isFunction(functionToCheck) {
        return functionToCheck && {}.toString.call(functionToCheck) === '[object Function]';
    }

    componentDidMount() {

       
    }


    render() {

        var self = this;
        return (
            <div>Hello World Related Exps</div>
        )
    }
}