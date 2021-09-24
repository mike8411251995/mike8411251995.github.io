(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "https://unpkg.com/gojs/release/go.js"], factory);
    }
})(function (require, exports) {
    'use strict';
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.init = void 0;

    var go = require("https://unpkg.com/gojs/release/go.js");
    function init() {
        var $ = go.GraphObject.make;
        var myDiagram = $(go.Diagram, 'myDiagramDiv', {
            layout: $(go.ForceDirectedLayout),
            mouseDrop: function(e) { finishDrop(e, null); },
            "undoManager.isEnabled": true,
            "toolManager.hoverDelay": 100
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

        function mergeGroup(selectedGroup, newGroup) {
            newGroup.addMembers(selectedGroup.memberParts, true);
            myDiagram.remove(selectedGroup)
        }

        function defaultColor(horiz) {  // a Binding conversion function
            return horiz ? "#FFDD33" : "#33D3E5";
        }

        function defaultFont(horiz) {  // a Binding conversion function
            return horiz ? "bold 18px sans-serif" : "bold 16px sans-serif";
        }

        myDiagram.nodeTemplate = $(go.Node, 'Auto',
            {
                mouseDrop: function(e, node) { mergeNode(e, node); },
                toolTip:
                $("ToolTip",
                    $(go.Panel, "Vertical",
                    $(go.Picture, { margin: 3, width: 768, height: 432 },
                        new go.Binding("source", "img", convertKeyFullImage)),
                    )
                )  // end Adornment
            },
            new go.Binding("click", "img", convertURL),
            $(go.Shape, "Rectangle", { fill: "lightgray" }),
            $(go.Picture,
                new go.Binding("desiredSize", "size", convertSize),
                new go.Binding("source", "img", convertKeyImage)
            )
        );

        myDiagram.groupTemplate = $(go.Group, "Auto",
            {
                layout: $(go.ForceDirectedLayout),
                ungroupable: true, 
                // highlight when dragging into the Group
                mouseDragEnter: function(e, grp, prev) { highlightGroup(e, grp, true); },
                mouseDragLeave: function(e, grp, next) { highlightGroup(e, grp, false); },
                computesBoundsAfterDrag: true,
                // when the selection is dropped into a Group, add the selected Parts into that Group;
                // if it fails, cancel the tool, rolling back any changes
                mouseDrop: function(e, grp) {
                    var selectedGroup = e.diagram.selection.first();
                    if (selectedGroup instanceof go.Group) {
                        mergeGroup(selectedGroup, grp);
                    } else if (selectedGroup instanceof go.Node) {
                        finishDrop(e, grp);
                    };
                },
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
        
        myDiagram.linkTemplate = $(go.Link,
            {
                curve: go.Link.Bezier,
                toolTip:
                $("ToolTip",
                    $(go.Panel, "Vertical",
                    $(go.Picture, { margin: 3, width: 768, height: 432 },
                        new go.Binding("source", "img", convertKeyFullImage)),
                    )
                )  // end Adornment
            },
            new go.Binding("click", "img", convertURL),
            $(go.Shape),
            $(go.Shape, { toArrow: "Standard" }),
            $(go.Panel, "Auto",
                $(go.Shape, "Rectangle", { fill: "white", stroke: "white" }),
                $(go.TextBlock, { margin: 3 },
                    {
                        opacity: 1.
                    },
                    new go.Binding("text", "text")),
                $(go.Picture,
                    {
                        segmentOffset: new go.Point(0, 0),
                    },
                    new go.Binding("desiredSize", "size", convertSize),
                    new go.Binding("source", "img", convertKeyImage)
                )
            )
        );
            
        myDiagram.model = new go.GraphLinksModel([
            { key: "Group0", isGroup: true },
            { key: "group00node00", img: "group00node00", group: "Group0", size: "192,108" },
            { key: "group00node01", img: "group00node01", group: "Group0", size: "190,108" },
            { key: "Group1", isGroup: true },
            { key: "group01node00", img: "group01node00", group: "Group1", size: "192,108" },
            { key: "Group2", isGroup: true },
            { key: "group02node00", img: "group02node00", group: "Group2", size: "192,80" },
        ], [
            { from: "group00node01", to: "group01node00", img: "link00", size: "156,30" },
            { from: "group01node00", to: "group02node00", img: "link01", size: "42,28" },
            { from: "group02node00", to: "group02node00", img: "link02", size: "200,12" },
            { from: "group02node00", to: "group00node00", img: "link03", size: "58,24" },
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
        return "imgs/real1_seq06/" + img + ".png";
    }

    function convertKeyFullImage(img) {
        return "imgs/real1_seq06/" + img + "_full.png";
    }

    function convertSize(size) {
        var width = parseInt(size.split(',')[0])
        var height = parseInt(size.split(',')[1])
        return new go.Size(width, height)
    }

    function convertURL(img) {
        return function() {
            window.open("imgs/real1_seq06/" + img + "_full.png");
        }
    }

    exports.init = init;
});
