import * as React from 'react';

import ChipInput from 'material-ui-chip-input'
import AutoComplete from 'material-ui/AutoComplete'
import axios from 'axios';
import config from '../config';


export interface Aorta3DClickableMapProps {
    onSelectRegion?: any,
    element: any,
    width: any,
    height: any
};
export interface Aorta3DClickableMapState {
    eleminfo: any,
    pixelinfo: any,
    current_element: any,
    current_image: any
};



export default class Aorta3DClickableMap extends React.Component < Aorta3DClickableMapProps, Aorta3DClickableMapState > {

    state={
        current_element: {id: null},
        current_image: null,
        eleminfo: null,
        pixelinfo: null
    }

    neo4jd3: any = null;

    canvas1: any;
    canvas2: any;

    drawing: any;

    canvas: any;
    paintCanvas: any;

    imageOrigSize: any;

    region2type: any;
    pixel2region: any;

    constructor(props) {
        super(props);

        this.canvas1 = React.createRef();
        this.canvas2 = React.createRef();


        this.canvas = document.createElement('canvas');
        this.paintCanvas = document.createElement('canvas');

        this.region2type = {}
        this.pixel2region = {}

        this.imageOrigSize = {x: 0, y: 0}
    }

    public static defaultProps: Partial < Aorta3DClickableMapProps > = {
        width: 300,
        height: 400,
        element: {}
    };



    isFunction(functionToCheck) {
        return functionToCheck && {}.toString.call(functionToCheck) === '[object Function]';
    }

    componentDidMount()
    {
        var self=this;
        if (self.canvas2.current)
        {
            console.log("canvas click registered")
            self.canvas2.current.addEventListener("click", (event) => this.handleCanvasClick(event));

            self.canvas2.current.width = self.props.width;
            self.canvas2.current.height = self.props.height;
        } else {
            console.log("canvas click NOT registered")
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot)
    {
        var self=this;

        console.log("clickable map did update")
        console.log("clickable map did update checks")

        if ((this.state.current_element == null) || (this.props.element.id !== this.state.current_element.id))
        {
            console.log("Upadting current element")
            self.setState({current_element: this.props.element});
        }

        if ((prevState.current_element == null) || (prevState.current_element.id !== self.state.current_element.id)|| (prevState.current_element.id !== self.state.current_element.id))
        {

            console.log("Fetching data clickable map")

            axios.post(config.getRestAddress() + "/getElementInfoImage", {id: self.state.current_element.id}, config.axiosConfig)
            .then(function (response) {

                console.log("getElementInfoImage response")
                console.log(response)

                self.setState({current_image: `data:image/png;base64,${response.data.image}`})
    
            })
            .catch(function (error) {

            });


            axios.post(config.getRestAddress() + "/getElementInfo", {id: self.state.current_element.id}, config.axiosConfig)
            .then(function (response) {

                console.log("get element info response")
                console.log(response)

                var data = response.data;//this.state.eleminfo;
                Object.keys(data.info).forEach((regionID) => {
    
                    var regionPixels = data.info[regionID];
                    var regionType = regionPixels.type_det;
    
                    self.region2type[regionID] = regionType;
    
                    regionPixels.coordinates.forEach((pixel) => {
                        self.pixel2region[pixel.join("_")] = regionID;
                    })
                })

                console.log("pixel2region")
                console.log(self.pixel2region)
                console.log("region2type")
                console.log(self.region2type)

                self.setState({eleminfo: response.data})    
    
            })
            .catch(function (error) {

            });





        }

    }


    getPixelDist(pd1, pd2)
    {

        if (pd1.length != pd2.length)
        {
            return 1000;
        }

        var totalDist = 0;
        for (var i=0; i < pd1.length; ++i)
        {
            var xdist = Math.abs(pd1[i] - pd2[i])

            totalDist += xdist*xdist;
        }

        return Math.sqrt(totalDist)

    }

    handleCanvasClick(event)
    {
        var self=this;
        event.stopPropagation();

        console.log("Canvas click")
        console.log(event)

        var cvBR = this.canvas1.current.getBoundingClientRect();
        console.log(cvBR)

        var posX = cvBR.left;
        var posY = cvBR.top;

        var clickX = event.layerX //(event.pageX - posX) - 7
        var clickY = event.layerY //(event.pageY - posY) - 7

        var imageX = Math.round(self.imageOrigSize.x * clickX/this.props.width)
        var imageY = Math.round(self.imageOrigSize.y * clickY/this.props.height)

        console.log(clickX/this.props.width + ";;" + clickY/this.props.height)

        //alert(clickX + " " + clickY + " ;; " + imageX + " " + imageY)

        var pixelData = self.canvas.getContext("2d").getImageData(imageX, imageY, 1, 1).data;

        // clear the image

        this.paintCanvas.width=this.imageOrigSize.x
        this.paintCanvas.height=this.imageOrigSize.y
        var paintCtx = this.paintCanvas.getContext('2d'); 
        
        paintCtx.clearRect(0,0,this.imageOrigSize.x, this.imageOrigSize.y)

        console.log(this.imageOrigSize)
        console.log(pixelData)

        var imagePosTuple = [imageX, this.imageOrigSize.y-imageY]


        var paintedpixels = 0;

        var origImageContext = self.canvas.getContext("2d");

        for (var i = 0; i < this.imageOrigSize.x; ++i)
        {
            for (var j = 0; j < this.imageOrigSize.y; ++j)
            {

                var imageCol = origImageContext.getImageData(i, j, 1, 1).data;

                var pixelDist = this.getPixelDist(pixelData, imageCol);

                if ( pixelDist < 2 )
                {                                
                    //ctx.fillStyle="rgba("+pixelData[0]+", "+pixelData[1]+", "+pixelData[2]+", 0.5)";
                    paintCtx.fillStyle="rgba(255,0,0, 1.0)";
                    paintCtx.fillRect(i,j,1,1)
                    paintedpixels+=1

                }

            }
        }

        let paintImage = new Image();
        paintImage.width=this.imageOrigSize.x
        paintImage.height=this.imageOrigSize.y
        paintImage.onload = function() {
            if (self.canvas2.current)
            {
                console.log("painting canvas2")
                self.canvas2.current.width = self.props.width;
                self.canvas2.current.height = self.props.height;

                self.canvas2.current.getContext("2d").clearRect(0, 0, self.props.width, self.props.height);
                self.canvas2.current.getContext("2d").drawImage(paintImage, 0, 0, self.props.width, self.props.height)
            } else {
                console.log("canvas2 empty")
                console.log(self.canvas2)
            }

            var pixelRegion = self.pixel2region[imagePosTuple.join("_")]
            var pixelTypes = self.region2type[pixelRegion]
            var pixelinfo = {
                position: {x: imagePosTuple[0], y:imagePosTuple[1]},
                region: pixelRegion,
                types: pixelTypes,
                painted: paintedpixels,
                element: self.state.current_element
            }
    
            if (self.isFunction(self.props.onSelectRegion))
            {

                const clone = JSON.parse(JSON.stringify(self.state.current_element));
                clone["cluster"] = pixelRegion
                console.log(clone)

                self.props.onSelectRegion(clone);
            }

            console.log("pixelinfo finished");
            console.log(pixelinfo);
            self.setState({pixelinfo: pixelinfo})
            
        };

        paintImage.src=this.paintCanvas.toDataURL();





    }


    render() {

        var self = this;

        var pixelSelected = "Unknown";
        var pixelRegion = "Unknown";
        var pixelType = "Unknown";

        console.log("clickable map render")
        console.log(this.state)

        if ((this.state) && (this.state.pixelinfo))
        {
            pixelSelected = "X=" + this.state.pixelinfo.position.x + ", Y=" + this.state.pixelinfo.position.y;
            pixelRegion = this.state.pixelinfo.region;
            pixelType = this.state.pixelinfo.types ? this.state.pixelinfo.types.join(", ") : "Unknown"

            //console.log(pixelSelected)
            //console.log(pixelRegion)
            //console.log(pixelType)
        }

        if (this.state.current_image)
        {
            this.drawing = new Image();
            this.drawing.src = this.state.current_image;
            this.drawing.onload = function() {
                console.log(self.drawing.width)
                console.log(self.drawing.height)
                console.log(self.drawing)

                self.imageOrigSize.x = self.drawing.width
                self.imageOrigSize.y = self.drawing.height

                self.canvas.width = self.drawing.width;
                self.canvas.height = self.drawing.height;

                self.canvas.getContext("2d").drawImage(self.drawing, 0, 0, self.drawing.width, self.drawing.height);

                self.canvas1.current.width = self.props.width;
                self.canvas1.current.height = self.props.height;

                self.canvas1.current.getContext("2d").drawImage(self.drawing,0,0, self.props.width,self.props.height);

            };
        }

        return (
            <div>
                <table>
                    <tr>
                        <td style={{width: this.props.width+10, height: this.props.height+10}}>
                            <div style={{position:"relative",width: this.props.width, height: this.props.height}}>
                                <canvas ref={this.canvas1} style={{top: "0px", left: "0px", position: "absolute", zIndex: 1}}>
                                </canvas>
                                <canvas ref={this.canvas2} style={{top: "0px", left: "0px", position: "absolute", zIndex: 2}}>
                                </canvas>
                            </div>
                        </td>
                        <td>
                            <p>Pixel Selected: <span id="pixel_pos">{pixelSelected}</span></p>
                            <p>Pixel Region: <span id="pixel_region">{pixelRegion}</span></p>
                            <p>Pixel Type: <span id="pixel_type">{pixelType}</span></p>
                        </td>
                    </tr>
                </table>
            </div>
        )
    }
}