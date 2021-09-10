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
            { key: 'group00node03', img: 'group00node03', group: '0' },
            { key: 'group00node04', img: 'group00node04', group: '0' },
            { key: 'group00node05', img: 'group00node05', group: '0' },
            { key: '1', isGroup: true },
            { key: 'group01node00', img: 'group01node00', group: '1' },
            { key: 'group01node01', img: 'group01node01', group: '1' },
            { key: 'group01node02', img: 'group01node02', group: '1' },
            { key: 'group01node03', img: 'group01node03', group: '1' },
            { key: 'group01node04', img: 'group01node04', group: '1' },
            { key: 'group01node05', img: 'group01node05', group: '1' },
        ], [
            { from: 'group00node00', to: 'group00node01', img: 'link00' },
            { from: 'group00node01', to: 'group00node02', img: 'link01' },
            { from: 'group00node02', to: 'group00node03', img: 'link02' },
            { from: 'group00node03', to: 'group00node04', img: 'link03' },
            { from: 'group00node04', to: 'group01node00', img: 'link04' },
            { from: 'group01node00', to: 'group01node01', img: 'link05' },
            { from: 'group01node01', to: 'group01node02', img: 'link06' },
            { from: 'group01node02', to: 'group01node03', img: 'link07' },
            { from: 'group01node03', to: 'group01node04', img: 'link08' },
            { from: 'group01node04', to: 'group01node05', img: 'link09' },
            { from: 'group01node05', to: 'group00node05', img: 'link10' },
        ]);
    }

    function convertKeyImage(img) {
        return "imgs/formPhmRules/" + img + ".png";
    }

    exports.init = init;
});
