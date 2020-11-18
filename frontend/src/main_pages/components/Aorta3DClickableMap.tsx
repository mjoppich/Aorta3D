import * as React from 'react';

import ChipInput from 'material-ui-chip-input'
import AutoComplete from 'material-ui/AutoComplete'
import axios from 'axios';
import config from '../config';


export interface Aorta3DClickableMapProps {
    onSelectRegion?: any,
    element: any,
    width: any,
    height: any,
    blendedIDs?: any
};
export interface Aorta3DClickableMapState {
    eleminfo: any,
    pixelinfo: any,
    current_element: any,
    current_image: any,
    blendedImages: any,
    blendedIDs: any
};



export default class Aorta3DClickableMap extends React.Component < Aorta3DClickableMapProps, Aorta3DClickableMapState > {

    state={
        current_element: {id: null},
        current_image: null,
        eleminfo: null,
        pixelinfo: null,
        blendedIDs: null,
        blendedImages: null
    }

    neo4jd3: any = null;

    canvas1: any;
    canvas2: any;

    blendcanvasRef: any;
    blendcanvas: any;

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
        this.blendcanvasRef = React.createRef();


        this.canvas = document.createElement('canvas');
        this.paintCanvas = document.createElement('canvas');
        this.blendcanvas = document.createElement('canvas');

        this.region2type = {}
        this.pixel2region = {}

        this.imageOrigSize = {x: 0, y: 0}
    }

    public static defaultProps: Partial < Aorta3DClickableMapProps > = {
        width: 400,
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

        if (prevProps.blendedIDs !== this.props.blendedIDs)
        {
            self.setState({blendedIDs: this.props.blendedIDs});
        }

        if ((prevState.blendedIDs == null) || (prevState.blendedIDs !== self.state.blendedIDs)|| (prevState.blendedIDs !== self.state.blendedIDs))
        {
            // download blended image data here
            self.state.blendedImages = [];

            if (self.state.blendedIDs)
            {

                if (self.state.blendedIDs.length == 0)
                {
                    console.log("blendedIDs empty %s", self.state.blendedIDs)
                    self.setState({blendedImages: []})
                } else {
                    console.log("blendedIDs: %s", self.state.blendedIDs)

                    self.state.blendedIDs.forEach((elementID) => {

                        axios.post(config.getRestAddress() + "/getElementInfoImage", {id: elementID}, config.axiosConfig)
                        .then(function (response) {
               
                            self.state.blendedImages.push(`data:image/png;base64,${response.data.image}`)
                            self.setState({blendedImages: self.state.blendedImages})
                
                        })
                        .catch(function (error) {
            
                        });
        
                    })
                }


            }

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

        var cvBR = this.canvas1.current.getBoundingClientRect();

        var posX = cvBR.left;
        var posY = cvBR.top;

        var clickX = event.layerX //(event.pageX - posX) - 7
        var clickY = event.layerY //(event.pageY - posY) - 7

        var imageX = Math.round(self.imageOrigSize.x * clickX/this.props.width)
        var imageY = Math.round(self.imageOrigSize.y * clickY/this.props.height)


        //alert(clickX + " " + clickY + " ;; " + imageX + " " + imageY)

        //var pixelData2 = self.canvas1.current.getContext("2d").getImageData(imageX, imageY, 1, 1).data;

        var imageContext = self.canvas1.current.getContext("2d");
        var pixelData = imageContext.getImageData(clickX, clickY, 1, 1).data;

        console.log('paintCanvas %s, %s', self.paintCanvas.width, self.paintCanvas.height)
        console.log('canvas %s, %s', self.canvas.width, self.canvas.height)


        this.paintCanvas.width=self.canvas.width
        this.paintCanvas.height=self.canvas.height
        
        var paintCtx = this.paintCanvas.getContext('2d'); 
        paintCtx.clearRect(0,0,this.paintCanvas.width, this.paintCanvas.height)

        const targetData = paintCtx.createImageData(this.paintCanvas.width, this.paintCanvas.height);
        const targetData32 = new Uint32Array(targetData.data.buffer);

        var imagePosTuple = [imageX, imageY]
        var paintedpixels = 0;

        var cvCtx = self.canvas.getContext("2d")
        const sourceData = cvCtx.getImageData(0,0, this.canvas.width, this.canvas.height).data;




        for (var i = 0; i < self.canvas.width; ++i)
        {
            //console.log('%s, %s', "i loop", i)
            for (var j = 0; j < self.canvas.height; ++j)
            {


                var index = (i + j * self.canvas.width) * 4;
                const red   = sourceData[index];
                const green = sourceData[index + 1];
                const blue  = sourceData[index + 2];
                const alpha = sourceData[index + 3];

                const colorValues = [red, green, blue, alpha];
                const pixelDist = this.getPixelDist(pixelData, colorValues);

                //console.log('%s %s, %s %s', i,j, pixelData, colorValues, pixelDist)

                if ( pixelDist < 2 )
                {
                    targetData32[i + j * self.canvas.width] = 0xFF0000FF;
                }

                continue

            }
        }

        paintCtx.putImageData(targetData,0,0);

        let paintImage = new Image();
        paintImage.width=this.imageOrigSize.x
        paintImage.height=this.imageOrigSize.y
        paintImage.onload = function() {
            if (self.canvas2.current)
            {
                self.canvas2.current.width = self.props.width;
                self.canvas2.current.height = self.props.height;

                self.canvas2.current.getContext("2d").clearRect(0, 0, self.props.width, self.props.height);
                self.canvas2.current.getContext("2d").drawImage(paintImage, 0, 0, self.props.width, self.props.height)
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

                self.props.onSelectRegion(clone);
            }


            self.setState({pixelinfo: pixelinfo})
            
        };

        paintImage.src=this.paintCanvas.toDataURL();





    }

    setTransparentColor(inCanvas, transparentColor=[68,1,84,255])
    {

        var cvCtx = inCanvas.getContext("2d")
        const sourceData = cvCtx.getImageData(0,0, inCanvas.width, inCanvas.height);
        var transparentPixels = 0;

        for (var i = 0; i < inCanvas.width; ++i)
        {
            //console.log('%s, %s', "i loop", i)
            for (var j = 0; j < inCanvas.height; ++j)
            {

                var index = (i + j * inCanvas.width) * 4;
                var red   = sourceData.data[index];
                var green = sourceData.data[index + 1];
                var blue  = sourceData.data[index + 2];
                var alpha = sourceData.data[index + 3];

                const colorValues = [red, green, blue, alpha];
                const pixelDist = this.getPixelDist(transparentColor, colorValues);

                //console.log('%s %s, %s %s', i,j, pixelData, colorValues, pixelDist)

                if ( pixelDist < 2 )
                {
                    red = 0;
                    green = 0;
                    blue = 0;
                    alpha = 0;    
                    
                    sourceData.data[index] = red;
                    sourceData.data[index+1] = green;
                    sourceData.data[index+2] = blue;
                    sourceData.data[index+3] = alpha;

                    transparentPixels += 1;
                }


            }
        }

        console.log("Manipulated canvas. Set %s transparent of %s", transparentPixels, inCanvas.width*inCanvas.height)

        cvCtx.putImageData(sourceData,0,0);
    }


    render() {

        var self = this;

        var pixelSelected = "Unknown";
        var pixelRegion = "Unknown";
        var pixelType = "Unknown";

        if ((this.state) && (this.state.pixelinfo))
        {
            pixelSelected = "X=" + this.state.pixelinfo.position.x + ", Y=" + this.state.pixelinfo.position.y;
            pixelRegion = this.state.pixelinfo.region;
            pixelType = this.state.pixelinfo.types ? this.state.pixelinfo.types.join(", ") : "Unknown"

        }

        if (this.state.current_image)
        {
            this.drawing = new Image();
            this.drawing.onload = function() {

                self.imageOrigSize.x = self.drawing.width
                self.imageOrigSize.y = self.drawing.height

                console.log('imageOrigSize %s, %s', self.imageOrigSize.x, self.imageOrigSize.y)

                self.canvas.getContext("2d").imageSmoothingEnabled=false;
                self.canvas.width = self.imageOrigSize.x;
                self.canvas.height = self.imageOrigSize.y;
                self.canvas.getContext("2d").drawImage(self.drawing,0,0, self.imageOrigSize.x,self.imageOrigSize.y);

                if (self.canvas1.current)
                {
                    self.canvas1.current.getContext("2d").imageSmoothingEnabled=false;

                    self.canvas1.current.width = self.props.width;
                    self.canvas1.current.height = self.props.height;
    
                    self.canvas1.current.getContext("2d").drawImage(self.drawing,0,0, self.props.width,self.props.height);

                    self.setTransparentColor(self.canvas1.current)
                }

            };
            this.drawing.src = this.state.current_image;

        }


        var belowOpacity = "100%";
        var mainOpacity = "100%";

        if (self.blendcanvasRef.current)
        {

            self.blendcanvasRef.current.width = self.canvas1.current.width;
            self.blendcanvasRef.current.height = self.canvas1.current.height;

            var ctx = self.blendcanvasRef.current.getContext("2d");
            ctx.clearRect(0, 0, self.canvas1.current.height, self.canvas1.current.height);
        }

        if ((this.state.blendedImages) && (this.state.blendedImages.length > 0))
        {
            if (self.blendcanvasRef.current)
            {
                var ctx = self.blendcanvasRef.current.getContext("2d");

                ctx.globalAlpha = 1.0/(this.state.blendedImages.length);
    
                this.state.blendedImages.forEach(element => {
    
                    var blendDrawing = new Image();
                    blendDrawing.src = element;
                    blendDrawing.onload = function() {
    
                        blendDrawing.width=self.canvas1.current.width;
                        blendDrawing.height=self.canvas1.current.height;
               
                        ctx.drawImage(blendDrawing, 0, 0, blendDrawing.width, blendDrawing.height);
        
        
                    };
                    
                });

                mainOpacity = "75%";
            }


        }



        return (
            <div>
                <table>
                    <tr>
                        <td style={{width: this.props.width+10, height: this.props.height+10}}>
                            <div style={{position:"relative",width: this.props.width, height: this.props.height}}>
                                <canvas ref={this.blendcanvasRef} style={{opacity: belowOpacity, top: "0px", left: "0px", position: "absolute", zIndex: 1}}>
                                </canvas>
                                <canvas ref={this.canvas1} style={{opacity: mainOpacity, top: "0px", left: "0px", position: "absolute", zIndex: 2}}>
                                </canvas>
                                <canvas ref={this.canvas2} style={{top: "0px", left: "0px", position: "absolute", zIndex: 3}}>
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