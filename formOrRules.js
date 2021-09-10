(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./gojs/release/go.js"], factory);
    }
})(function (require, exports) {
    'use strict';
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.init = void 0;

    var go = require("./gojs/release/go.js");
    function init() {
        var $ = go.GraphObject.make;
        var myDiagram = $(go.Diagram, 'myDiagramDiv',
            { 'undoManager.isEnabled': true }
        );

        myDiagram.nodeTemplate = $(go.Node, 'Auto',
            $(go.Picture,
                { 
                    desiredSize: new go.Size(192, 108)
                },
                new go.Binding("source", "img", convertKeyImage)
            )
        );

        myDiagram.groupTemplate = $(go.Group, "Auto",
            { layout: $(go.LayeredDigraphLayout,
                       { direction: 0, columnSpacing: 10 }) },
            $(go.Shape, "RoundedRectangle",  // surrounds everything
             { parameter1: 10, fill: "rgba(128,128,128,0.33)" }),
            $(go.Panel, "Vertical",  // position header above the subgraph
                $(go.TextBlock,     // group title near top, next to button
                    { font: "Bold 12pt Sans-Serif" },
                    new go.Binding("text", "key")),
                    $(go.Placeholder,     // represents area for all member parts
                     { padding: 5, background: "white" }
                    )
            )
        );
        
        myDiagram.linkTemplate =
            $(go.Link,
                { curve: go.Link.Bezier },
                $(go.Shape),
                $(go.Shape, { toArrow: "Standard" }),
                $(go.Picture,
                    {
                        // maxSize: new go.Size(NaN, 50),
                        segmentOffset: new go.Point(0, 0),
                    },
                    new go.Binding("source", "img", convertKeyImage)
                )
            );
        myDiagram.model = new go.GraphLinksModel([
            { key: '0', isGroup: true },
            { key: 'group00node00', img: 'group00node00', group: '0' },
            { key: 'group00node01', img: 'group00node01', group: '0' },
            { key: 'group00node02', img: 'group00node02', group: '0' },
            { key: '1', isGroup: true },
            { key: 'group01node00', img: 'group01node00', group: '1' },
            { key: 'group01node01', img: 'group01node01', group: '1' },
            { key: 'group01node02', img: 'group01node02', group: '1' },
            { key: 'group01node03', img: 'group01node03', group: '1' },
            { key: 'group01node04', img: 'group01node04', group: '1' },
            { key: 'group01node05', img: 'group01node05', group: '1' },
            { key: 'group01node06', img: 'group01node06', group: '1' },
            { key: 'group01node07', img: 'group01node07', group: '1' },
            { key: 'group01node08', img: 'group01node08', group: '1' },
            { key: 'group01node09', img: 'group01node09', group: '1' },
            { key: '2', isGroup: true },
            { key: 'group02node00', img: 'group02node00', group: '2' },
            { key: 'group02node01', img: 'group02node01', group: '2' },
        ], [
            { from: 'group00node00', to: 'group00node01', img: 'link00' },
            { from: 'group00node01', to: 'group02node00', img: 'link01' },
            { from: 'group02node00', to: 'group02node01', img: 'link02' },
            { from: 'group02node01', to: 'group01node00', img: 'link03' },
            { from: 'group01node00', to: 'group01node01', img: 'link04' },
            { from: 'group01node01', to: 'group01node02', img: 'link05' },
            { from: 'group01node02', to: 'group01node03', img: 'link06' },
            { from: 'group01node03', to: 'group01node04', img: 'link07' },
            { from: 'group01node04', to: 'group01node05', img: 'link08' },
            { from: 'group01node05', to: 'group01node06', img: 'link09' },
            { from: 'group01node06', to: 'group01node07', img: 'link10' },
            { from: 'group01node07', to: 'group01node08', img: 'link11' },
            { from: 'group01node08', to: 'group01node09', img: 'link12' },
            { from: 'group01node09', to: 'group00node02', img: 'link13' },
        ]);
    }

    function convertKeyImage(img) {
        return "imgs/formOrRules/" + img + ".png";
    }

    exports.init = init;
});
