(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "../../gojs/release/go.js"], factory);
    }
})(function (require, exports) {
    'use strict';
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.init = void 0;

    var go = require("../../gojs/release/go.js");
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
            // Insert graph here
        ]);
    }

    function convertKeyImage(img) {
        return "imgs/" + img + ".png";
    }

    exports.init = init;
});
