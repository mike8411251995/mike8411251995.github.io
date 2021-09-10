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
            { key: "0", isGroup: true },
            { key: "group00node00", img: "group00node00", group: "0" },
            { key: "group00node01", img: "group00node01", group: "0" },
            { key: "group00node02", img: "group00node02", group: "0" },
            { key: "group00node03", img: "group00node03", group: "0" },
            { key: "group00node04", img: "group00node04", group: "0" },
            { key: "group00node05", img: "group00node05", group: "0" },
            { key: "group00node06", img: "group00node06", group: "0" },
            { key: "group00node07", img: "group00node07", group: "0" },
            { key: "group00node08", img: "group00node08", group: "0" },
            { key: "group00node09", img: "group00node09", group: "0" },
            { key: "group00node10", img: "group00node10", group: "0" },
            { key: "group00node11", img: "group00node11", group: "0" },
            { key: "group00node12", img: "group00node12", group: "0" },
            { key: "group00node13", img: "group00node13", group: "0" },
            { key: "group00node14", img: "group00node14", group: "0" },
            { key: "group00node15", img: "group00node15", group: "0" },
            { key: "group00node16", img: "group00node16", group: "0" },
            { key: "group00node17", img: "group00node17", group: "0" },
            { key: "group00node18", img: "group00node18", group: "0" },
            { key: "group00node19", img: "group00node19", group: "0" },
            { key: "group00node20", img: "group00node20", group: "0" },
            { key: "1", isGroup: true },
            { key: "group01node00", img: "group01node00", group: "1" },
            { key: "group01node01", img: "group01node01", group: "1" },
            { key: "2", isGroup: true },
            { key: "group02node00", img: "group02node00", group: "2" },
            { key: "3", isGroup: true },
            { key: "group03node00", img: "group03node00", group: "3" },
            { key: "group03node01", img: "group03node01", group: "3" },
            { key: "group03node02", img: "group03node02", group: "3" },
            { key: "group03node03", img: "group03node03", group: "3" },
            { key: "group03node04", img: "group03node04", group: "3" },
            { key: "group03node05", img: "group03node05", group: "3" },
            { key: "group03node06", img: "group03node06", group: "3" },
            { key: "4", isGroup: true },
            { key: "group04node00", img: "group04node00", group: "4" },
            { key: "group04node01", img: "group04node01", group: "4" },
            { key: "group04node02", img: "group04node02", group: "4" },
            { key: "group04node03", img: "group04node03", group: "4" },
            { key: "5", isGroup: true },
            { key: "group05node00", img: "group05node00", group: "5" },
            { key: "group05node01", img: "group05node01", group: "5" },
            { key: "group05node02", img: "group05node02", group: "5" },
            { key: "group05node03", img: "group05node03", group: "5" },
            { key: "6", isGroup: true },
            { key: "group06node00", img: "group06node00", group: "6" },
            { key: "group06node01", img: "group06node01", group: "6" },
            { key: "7", isGroup: true },
            { key: "group07node00", img: "group07node00", group: "7" },
            { key: "8", isGroup: true },
            { key: "group08node00", img: "group08node00", group: "8" },
            { key: "group08node01", img: "group08node01", group: "8" },
            { key: "group08node02", img: "group08node02", group: "8" },
            { key: "group08node03", img: "group08node03", group: "8" },
            { key: "group08node04", img: "group08node04", group: "8" },
            { key: "9", isGroup: true },
            { key: "group09node00", img: "group09node00", group: "9" },
            { key: "group09node01", img: "group09node01", group: "9" },
            { key: "10", isGroup: true },
            { key: "group10node00", img: "group10node00", group: "10" },
            { key: "11", isGroup: true },
            { key: "group11node00", img: "group11node00", group: "11" },
            { key: "group11node01", img: "group11node01", group: "11" },
            { key: "group11node02", img: "group11node02", group: "11" },
            { key: "group11node03", img: "group11node03", group: "11" },
            { key: "12", isGroup: true },
            { key: "group12node00", img: "group12node00", group: "12" },
            { key: "group12node01", img: "group12node01", group: "12" },
            { key: "group12node02", img: "group12node02", group: "12" },
            { key: "group12node03", img: "group12node03", group: "12" },
            { key: "13", isGroup: true },
            { key: "group13node00", img: "group13node00", group: "13" },
            { key: "group13node01", img: "group13node01", group: "13" },
            { key: "14", isGroup: true },
            { key: "group14node00", img: "group14node00", group: "14" },
            { key: "15", isGroup: true },
            { key: "group15node00", img: "group15node00", group: "15" },
            { key: "group15node01", img: "group15node01", group: "15" },
            { key: "group15node02", img: "group15node02", group: "15" },
        ], [
            { from: "group00node00", to: "group00node01", img: "link00" },
            { from: "group00node01", to: "group03node00", img: "link01" },
            { from: "group03node00", to: "group03node01", img: "link02" },
            { from: "group03node01", to: "group15node00", img: "link03" },
            { from: "group15node00", to: "group15node01", img: "link04" },
            { from: "group15node01", to: "group15node02", img: "link05" },
            { from: "group15node02", to: "group00node02", img: "link06" },
            { from: "group00node02", to: "group00node03", img: "link07" },
            { from: "group00node03", to: "group13node00", img: "link08" },
            { from: "group13node00", to: "group14node00", img: "link09" },
            { from: "group14node00", to: "group13node01", img: "link10" },
            { from: "group13node01", to: "group12node00", img: "link11" },
            { from: "group12node00", to: "group12node01", img: "link12" },
            { from: "group12node01", to: "group12node02", img: "link13" },
            { from: "group12node02", to: "group12node03", img: "link14" },
            { from: "group12node03", to: "group00node04", img: "link15" },
            { from: "group00node04", to: "group00node05", img: "link16" },
            { from: "group00node05", to: "group03node02", img: "link17" },
            { from: "group03node02", to: "group03node03", img: "link18" },
            { from: "group03node03", to: "group11node00", img: "link19" },
            { from: "group11node00", to: "group11node01", img: "link20" },
            { from: "group11node01", to: "group11node02", img: "link21" },
            { from: "group11node02", to: "group11node03", img: "link22" },
            { from: "group11node03", to: "group00node06", img: "link23" },
            { from: "group00node06", to: "group00node07", img: "link24" },
            { from: "group00node07", to: "group10node00", img: "link25" },
            { from: "group10node00", to: "group03node04", img: "link26" },
            { from: "group03node04", to: "group08node00", img: "link27" },
            { from: "group08node00", to: "group08node01", img: "link28" },
            { from: "group08node01", to: "group08node02", img: "link29" },
            { from: "group08node02", to: "group08node03", img: "link30" },
            { from: "group08node03", to: "group00node08", img: "link31" },
            { from: "group00node08", to: "group00node09", img: "link32" },
            { from: "group00node09", to: "group05node00", img: "link33" },
            { from: "group05node00", to: "group05node01", img: "link34" },
            { from: "group05node01", to: "group04node00", img: "link35" },
            { from: "group04node00", to: "group04node01", img: "link36" },
            { from: "group04node01", to: "group00node10", img: "link37" },
            { from: "group00node10", to: "group09node00", img: "link38" },
            { from: "group09node00", to: "group09node01", img: "link39" },
            { from: "group09node01", to: "group00node11", img: "link40" },
            { from: "group00node11", to: "group08node04", img: "link41" },
            { from: "group08node04", to: "group00node12", img: "link42" },
            { from: "group00node12", to: "group00node13", img: "link43" },
            { from: "group00node13", to: "group07node00", img: "link44" },
            { from: "group07node00", to: "group06node00", img: "link45" },
            { from: "group06node00", to: "group06node01", img: "link46" },
            { from: "group06node01", to: "group00node14", img: "link47" },
            { from: "group00node14", to: "group00node15", img: "link48" },
            { from: "group00node15", to: "group00node16", img: "link49" },
            { from: "group00node16", to: "group00node17", img: "link50" },
            { from: "group00node17", to: "group05node02", img: "link51" },
            { from: "group05node02", to: "group05node03", img: "link52" },
            { from: "group05node03", to: "group04node02", img: "link53" },
            { from: "group04node02", to: "group04node03", img: "link54" },
            { from: "group04node03", to: "group00node18", img: "link55" },
            { from: "group00node18", to: "group00node19", img: "link56" },
            { from: "group00node19", to: "group03node05", img: "link57" },
            { from: "group03node05", to: "group03node06", img: "link58" },
            { from: "group03node06", to: "group02node00", img: "link59" },
            { from: "group02node00", to: "group01node00", img: "link60" },
            { from: "group01node00", to: "group01node01", img: "link61" },
            { from: "group01node01", to: "group00node20", img: "link62" },
        ]);
    }

    function convertKeyImage(img) {
        return "imgs/focused/" + img + ".png";
    }

    exports.init = init;
});
