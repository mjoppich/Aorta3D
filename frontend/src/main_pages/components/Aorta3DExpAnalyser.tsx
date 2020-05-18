import * as React from 'react';

import ChipInput from 'material-ui-chip-input'
import AutoComplete from 'material-ui/AutoComplete'
import axios from 'axios';
import config from '../config';


export interface Aorta3DExpAnalyserProps {
    onSelectElement?: any
};
export interface Aorta3DExpAnalyserState {
    eleminfo: any
};



export default class Aorta3DExpAnalyser extends React.Component < Aorta3DExpAnalyserProps, Aorta3DExpAnalyserState > {

    neo4jd3: any = null;

    constructor(props) {
        super(props);
    }

    public static defaultProps: Partial < Aorta3DExpAnalyserProps > = {
    };



    isFunction(functionToCheck) {
        return functionToCheck && {}.toString.call(functionToCheck) === '[object Function]';
    }

    componentDidMount() {

       
    }


    render() {

        var self = this;
        return (
            <div>Hello World Exp Analyser</div>
        )
    }
}