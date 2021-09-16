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
        var myDiagram = $(go.Diagram, 'myDiagramDiv', {
            mouseDrop: function(e) { finishDrop(e, null); },
            "undoManager.isEnabled": true,
        });

        // this function is used to highlight a Group that the selection may be dropped into
        function highlightGroup(e, grp, show) {
            if (!grp) return;
            e.handled = true;
            if (show) {
                // cannot depend on the grp.diagram.selection in the case of external drag-and-drops;
                // instead depend on the DraggingTool.draggedParts or .copiedParts
                var tool = grp.diagram.toolManager.draggingTool;
                var map = tool.draggedParts || tool.copiedParts;  // this is a Map
                // now we can check to see if the Group will accept membership of the dragged Parts
                if (grp.canAddMembers(map.toKeySet())) {
                    grp.isHighlighted = true;
                    return;
                }
            }
            grp.isHighlighted = false;
        }

        // Upon a drop onto a Group, we try to add the selection as members of the Group.
        // Upon a drop onto the background, or onto a top-level Node, make selection top-level.
        // If this is OK, we're done; otherwise we cancel the operation to rollback everything.
        function finishDrop(e, grp) {
            var ok = (grp !== null
                ? grp.addMembers(grp.diagram.selection, true)
                : e.diagram.commandHandler.addTopLevelParts(e.diagram.selection, true));
            if (!ok) e.diagram.currentTool.doCancel();
        }

        function mergeNode(e, node) {
            var newnode = e.diagram.selection.first();
            while (node.findLinksConnected().first()) {
                var link = node.findLinksConnected().first()
                var fromnode = link.fromNode;
                var tonode = link.toNode;
                var linkImg = link.data.img;
                node.diagram.model.removeLinkData(link.data);
                if (fromnode.key === tonode.key) {
                    node.diagram.model.addLinkData( { from: newnode.key, to: newnode.key, img: linkImg } );
                } else if (fromnode.key === node.key) {
                    node.diagram.model.addLinkData( { from: newnode.key, to: tonode.key, img: linkImg } );
                } else if (tonode.key === node.key) {
                    node.diagram.model.addLinkData( { from: fromnode.key, to: newnode.key, img: linkImg } );
                }
            }
            myDiagram.remove(node);
        }

        function defaultColor(horiz) {  // a Binding conversion function
            return horiz ? "#FFDD33" : "#33D3E5";
        }

        function defaultFont(horiz) {  // a Binding conversion function
            return horiz ? "bold 18px sans-serif" : "bold 16px sans-serif";
        }

        myDiagram.nodeTemplate = $(go.Node, 'Auto',
            {
                mouseDrop: function(e, node) { mergeNode(e, node); }
            },
            $(go.Picture,
                new go.Binding("desiredSize", "size", convertSize),
                new go.Binding("source", "img", convertKeyImage)
            )
        );

        myDiagram.groupTemplate = $(go.Group, "Auto",
            {
                layout: $(go.LayeredDigraphLayout,
                {
                    direction: 90,
                    columnSpacing: 10,
                    layerSpacing: 50
                }),
                ungroupable: true, 
                // highlight when dragging into the Group
                mouseDragEnter: function(e, grp, prev) { highlightGroup(e, grp, true); },
                mouseDragLeave: function(e, grp, next) { highlightGroup(e, grp, false); },
                computesBoundsAfterDrag: true,
                // when the selection is dropped into a Group, add the selected Parts into that Group;
                // if it fails, cancel the tool, rolling back any changes
                mouseDrop: finishDrop,
                handlesDragDropForMembers: true,  // don't need to define handlers on member Nodes and Links
                // Groups containing Groups lay out their members horizontally
            },
            new go.Binding("background", "isHighlighted", function(h) {
                return h ? "rgba(255,0,0,0.2)" : "transparent";
            }).ofObject(),
            $(go.Shape, "Rectangle",
                { fill: null, stroke: defaultColor(false), strokeWidth: 2 },
                new go.Binding("stroke", "horiz", defaultColor),
                new go.Binding("stroke", "color")
            ),
            $(go.Panel, "Vertical",  // title above Placeholder
                $(go.Panel, "Horizontal",  // button next to TextBlock
                    { stretch: go.GraphObject.Horizontal, background: defaultColor(false) },
                    new go.Binding("background", "horiz", defaultColor),
                    new go.Binding("background", "color"),
                    $("SubGraphExpanderButton",
                        { alignment: go.Spot.Right, margin: 5 } ),
                    $(go.TextBlock,
                        {
                            alignment: go.Spot.Left,
                            editable: true,
                            margin: 5,
                            font: defaultFont(false),
                            opacity: 0.75,  // allow some color to show through
                            stroke: "#404040"
                        },
                        new go.Binding("font", "horiz", defaultFont),
                        new go.Binding("text", "key").makeTwoWay()
                    )
                ),  // end Horizontal Panel
                $(go.Placeholder,
                    { padding: 5, alignment: go.Spot.TopLeft } )
            )  // end Vertical Panel
        );
        
        myDiagram.linkTemplate =
            $(go.Link,
                { curve: go.Link.Bezier },
                $(go.Shape),
                $(go.Shape, { toArrow: "Standard" }),
                $(go.Picture,
                    {
                        segmentOffset: new go.Point(0, 0),
                    },
                    new go.Binding("desiredSize", "size", convertSize),
                    new go.Binding("source", "img", convertKeyImage)
                )
            );
            
        myDiagram.model = new go.GraphLinksModel([
            { key: "Group0", isGroup: true },
            { key: "group00node00", img: "group00node00", group: "Group0", size: "192,108" },
            { key: "group00node01", img: "group00node01", group: "Group0", size: "190,108" },
            { key: "group00node02", img: "group00node02", group: "Group0", size: "192,98" },
            { key: "group00node03", img: "group00node03", group: "Group0", size: "192,108" },
            { key: "group00node04", img: "group00node04", group: "Group0", size: "192,108" },
            { key: "Group1", isGroup: true },
            { key: "group01node00", img: "group01node00", group: "Group1", size: "192,108" },
            { key: "Group2", isGroup: true },
            { key: "group02node00", img: "group02node00", group: "Group2", size: "192,108" },
            { key: "Group3", isGroup: true },
            { key: "group03node00", img: "group03node00", group: "Group3", size: "192,108" },
            { key: "group03node01", img: "group03node01", group: "Group3", size: "192,108" },
            { key: "Group4", isGroup: true },
            { key: "group04node00", img: "group04node00", group: "Group4", size: "192,108" },
            { key: "Group5", isGroup: true },
            { key: "group05node00", img: "group05node00", group: "Group5", size: "192,80" },
            { key: "Group6", isGroup: true },
            { key: "group06node00", img: "group06node00", group: "Group6", size: "192,108" },
            { key: "Group7", isGroup: true },
            { key: "group07node00", img: "group07node00", group: "Group7", size: "192,108" },
            { key: "group07node01", img: "group07node01", group: "Group7", size: "3,5" },
            { key: "group07node02", img: "group07node02", group: "Group7", size: "3,8" },
        ], [
            { from: "group00node00", to: "group00node00", img: "link00", size: "96,24" },
            { from: "group00node00", to: "group01node00", img: "link01", size: "42,24" },
            { from: "group01node00", to: "group02node00", img: "link02", size: "200,14" },
            { from: "group02node00", to: "group03node00", img: "link03", size: "30,19" },
            { from: "group03node00", to: "group03node00", img: "link04", size: "200,33" },
            { from: "group03node00", to: "group03node00", img: "link05", size: "194,50" },
            { from: "group03node00", to: "group00node00", img: "link06", size: "30,19" },
            { from: "group00node00", to: "group00node01", img: "link07", size: "78,27" },
            { from: "group00node01", to: "group04node00", img: "link08", size: "21,19" },
            { from: "group04node00", to: "group04node00", img: "link09", size: "138,25" },
            { from: "group04node00", to: "group05node00", img: "link10", size: "38,24" },
            { from: "group05node00", to: "group05node00", img: "link11", size: "200,12" },
            { from: "group05node00", to: "group00node00", img: "link12", size: "58,24" },
            { from: "group00node00", to: "group06node00", img: "link13", size: "106,50" },
            { from: "group06node00", to: "group06node00", img: "link14", size: "200,8" },
            { from: "group06node00", to: "group00node02", img: "link15", size: "96,28" },
            { from: "group00node02", to: "group03node01", img: "link16", size: "58,24" },
            { from: "group03node01", to: "group00node00", img: "link17", size: "30,19" },
            { from: "group00node00", to: "group00node00", img: "link18", size: "200,21" },
            { from: "group00node00", to: "group07node00", img: "link19", size: "78,27" },
            { from: "group07node00", to: "group07node01", img: "link20", size: "116,28" },
            { from: "group07node01", to: "group07node02", img: "link21", size: "64,50" },
            { from: "group07node02", to: "group00node00", img: "link22", size: "195,28" },
            { from: "group00node00", to: "group00node03", img: "link23", size: "20,24" },
            { from: "group00node03", to: "group00node04", img: "link24", size: "106,50" },
            { from: "group00node04", to: "group00node01", img: "link25", size: "78,28" },
        ]);

        // initialize the Palette and its contents
        var myPalette = $(go.Palette, "myPaletteDiv",
            {
                nodeTemplateMap: myDiagram.nodeTemplateMap,
                groupTemplateMap: myDiagram.groupTemplateMap
            }
        );

        myPalette.model = new go.GraphLinksModel([
            { key: "Group", isGroup: true },
        ]);
    }

    function convertKeyImage(img) {
        return "imgs/REH_420051921003_ditto_needs_to_have_description_in_pdf_preview_2021_09_10-02_28_51/" + img + ".png";
    }

    function convertSize(size) {
        var width = parseInt(size.split(',')[0])
        var height = parseInt(size.split(',')[1])
        return new go.Size(width, height)
    }

    exports.init = init;
});
