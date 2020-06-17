import * as React from 'react';

import ChipInput from 'material-ui-chip-input'
import AutoComplete from 'material-ui/AutoComplete'
import axios from 'axios';
import config from '../config';
import FlatButton from 'material-ui/FlatButton';

import MaterialTable from 'material-table';
import { type } from 'os';
import { ScatterPlot, ScatterSeries,ScatterPoint } from 'reaviz';
import Plot from 'react-plotly.js';


export interface Aorta3DDEResViewerProps {
    onSelectGene?: any,
    element: any,
    exp_type: any
};
export interface Aorta3DDEResViewerState {
    eleminfo: any,
    current_element: any,
    current_table: any
};



export default class Aorta3DDEResViewer extends React.Component < Aorta3DDEResViewerProps, Aorta3DDEResViewerState > {

    state = {
        current_table: [],
        current_element: null,
        eleminfo: null
    }

    constructor(props) {
        super(props);
    }

    public static defaultProps: Partial < Aorta3DDEResViewerProps > = {
    };

    getRowDetails(rowdata)
    {
        if (this.isFunction(this.props.onSelectGene))
        {
            this.props.onSelectGene(rowdata);
        }

    }


    isFunction(functionToCheck) {
        return functionToCheck && {}.toString.call(functionToCheck) === '[object Function]';
    }

    setDETable(table)
    {
        var self=this;
        self.setState({current_table: table})

    }

    componentDidUpdate(prevProps, prevState, snapshot)
    {
        var self=this;

        if (prevProps.element !== this.props.element)
        {

            console.log("[DE RES]: Setting current element from props")
            console.log(this.props.element)
            self.setState({current_element: this.props.element});

            return;
        }

        if (self.state.current_element == null)
        {
            return;
        }

        if ((prevState.current_element == null) || (prevState.current_element.id !== self.state.current_element.id)|| (prevState.current_element.cluster !== self.state.current_element.cluster))
        {

            console.log("[DE RES]: current_element not null")
            console.log(prevState.element)
            console.log(self.state.current_element)

            if (self.state.current_element.id)
            {
                console.log("Fetching related DE data")
                console.log(self.state.current_element)
        
                axios.post(config.getRestAddress() + "/getElementInfoDE", self.state.current_element, config.axiosConfig)
                .then(function (response) {

                    console.log("getElementInfoImage response")
                    console.log(response)

                    self.setState({current_table: response.data})
        
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

        //clusterID	gene_ident	gene_mass	gene	protein_mass	avg_logFC	qvalue	num	anum	mean	median	num_bg	anum_bg	mean_bg	median_bg
        //p_val	avg_logFC	pct.1	pct.2	p_val_adj	gene
        var self = this;

        if (self.state.current_element != null)
        {
            var cols= [];
            var scatterData = {x: [], y:[], text: [], text_pval: []}

            var maxNegLog = 200

            if (this.props.exp_type == "msi")
            {
                cols = [
                    { title: 'Cluster ID', field: 'clusterID' },
                    { title: 'Protein Mass', field: 'gene_mass' },
                    { title: 'Assoc. Gene', field: 'gene' },
                    { title: 'Assoc. Gene Mass', field: 'protein_mass' },
                    { title: 'Avg. logFC', field: 'avg_logFC' },
                    { title: 'q-value', field: 'qvalue' },
                    { title: 'Mean Intensity', field: 'mean' },
                    { title: 'Mean Intensity (Background)', field: 'mean_bg' },
                    { title: 'Details', render: rowData => <FlatButton onClick={() => {this.getRowDetails(rowData)}}>Details</FlatButton> },
                  ]

                  this.state.current_table.forEach((elem) => {
                    var negLog = maxNegLog;
                    var pvalAdj = elem["qvalue"];
                    if (pvalAdj > 0)
                    {
                        negLog = -Math.log(pvalAdj)

                        if (negLog > maxNegLog)
                        {
                            negLog = maxNegLog
                        }
                    }

                    scatterData.x.push(elem["avg_logFC"])
                    scatterData.y.push(negLog)
                    scatterData.text.push(elem["gene"])
                    scatterData.text_pval.push(pvalAdj)

              })


            } else if (this.props.exp_type == "scrna")
            {
                cols = [
                    { title: 'Gene', field: 'gene' },
                    { title: 'Avg. logFC', field: 'avg_logFC' },
                    { title: 'p-Value (raw)', field: 'p_val' },
                    { title: 'p-Value (adjusted)', field: 'p_val_adj' },
                    { title: 'Details', render: rowData => <FlatButton onClick={() => {this.getRowDetails(rowData)}}>Details</FlatButton> },
                  ]


                  this.state.current_table.forEach((elem) => {
                        var negLog = maxNegLog;
                        var pvalAdj = elem["p_val_adj"];
                        if (pvalAdj > 0)
                        {
                            negLog = -Math.log(pvalAdj)

                            if (negLog > maxNegLog)
                            {
                                negLog = maxNegLog
                            }
                        }


                        scatterData.x.push(elem["avg_logFC"])
                        scatterData.y.push(negLog)
                        scatterData.text.push(elem["gene"])
                        scatterData.text_pval.push(pvalAdj)
                  })

            }

            console.log(scatterData)

            return (<div>
                <MaterialTable
                title="Differential Analysis Results"
                columns={cols}
                data={self.state.current_table.slice(1, self.state.current_element.length)}
                actions={[
                    {
                      icon: 'save',
                      tooltip: 'Check Details',
                      onClick: (event, rowData) => self.isFunction(self.props.onSelectGene) ? self.props.onSelectGene(rowData) : function() {}
                    }
                  ]}
                options={{
                  filtering: true,
                  selection: true
                }}
                onSelectionChange={(rows) => alert('You selected ' + rows.length + ' rows')}
              />

<Plot
        data={[
          {
            x: scatterData.x,
            y: scatterData.y,
            hovertemplate: '<b>%{text}</b><br><i>Adj. p-Value</i>: %{customdata}<br><i>Avg. log2FC</i>: %{x}',
            customdata: scatterData.text_pval,
            text: scatterData.text,
            type: 'scatter',
            mode: 'markers',
            marker: {color: 'red'},
          },
        ]}
        layout={{
            width: 800,
            height: 600,
            hovermode:'closest',
            title: 'Volcano Plot of DE Genes (abs log2FC > 0.5, adj. pval < 0.05)',
            xaxis_title: "Avg. log2FC",
            yaxis_title:"-log adj. p-value"
        }}
      />

            </div>
            )
        } else {
            return (<p>No data selected.</p>)
        }
        
    }
}