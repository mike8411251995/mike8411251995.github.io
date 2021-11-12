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
        var layoutSpacing = new go.Size(192, 108);
        var myDiagram = $(go.Diagram, 'myDiagramDiv', {
            layout: $(go.ForceDirectedLayout),
            // layout: $(go.GridLayout, { spacing: layoutSpacing } ),
            mouseDrop: function(e) { finishDrop(e, null); },
            "undoManager.isEnabled": true,
            "toolManager.hoverDelay": 100
        });

        // Hide tooltip when dragging
        var draggingTool = myDiagram.toolManager.draggingTool;
        draggingTool.doActivate = function() {
            myDiagram.toolManager.hideToolTip();
            go.DraggingTool.prototype.doActivate.call(draggingTool);
        }

        // Expand groups with only one immediate children
        function autoExpand() {
            myDiagram.nodes.each(function(n) {
                if (n instanceof go.Group) {
                    if (n.data.level == 0) { n.expandSubGraph(); return; }
                    var memberCount = 0;
                    n.memberParts.each(function(m) {
                        if (m instanceof go.Group || m instanceof go.Node) memberCount += 1;
                    })
                    if (memberCount <= 1) n.expandSubGraph();
                    else n.collapseSubGraph();
                }
            });
        }

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
                var linkText = link.data.text;
                var linkImg = link.data.img;
                var linkSize = link.data.size;
                node.diagram.model.removeLinkData(link.data);
                if (fromnode.key === tonode.key) {
                    node.diagram.model.addLinkData( { from: newnode.key, to: newnode.key, text: linkText, img: linkImg, size: linkSize } );
                } else if (fromnode.key === node.key) {
                    node.diagram.model.addLinkData( { from: newnode.key, to: tonode.key, text: linkText, img: linkImg, size: linkSize } );
                } else if (tonode.key === node.key) {
                    node.diagram.model.addLinkData( { from: fromnode.key, to: newnode.key, text: linkText, img: linkImg, size: linkSize } );
                }
            }
            myDiagram.remove(node);
        }

        function mergeGroup(selectedGroup, newGroup) {
            newGroup.addMembers(selectedGroup.memberParts, true);
            myDiagram.remove(selectedGroup)
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
                // layout: $(go.GridLayout, { spacing: layoutSpacing } ),
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
                        if (selectedGroup.data.level == grp.data.level) { mergeGroup(selectedGroup, grp); }
                        else if (selectedGroup.data.level > grp.data.level) { finishDrop(e, grp); }
                        else { e.diagram.currentTool.doCancel(); }
                    } else if (selectedGroup instanceof go.Node) {
                        finishDrop(e, grp);
                    };
                },
                handlesDragDropForMembers: true,  // don't need to define handlers on member Nodes and Links
                // Groups containing Groups lay out their members horizontally
                toolTip:
                $("ToolTip",
                    // new go.Binding("visible", "isSubGraphExpanded", inverter).ofObject(), // TODO: visible only when collapsed
                    new go.Binding("visible", "level", convertLevelVisible),
                    $(go.Panel, "Vertical",
                    $(go.Picture, { margin: 3, width: 768, height: 432 },
                        new go.Binding("source", "key", convertKeyImage)),
                    )
                )  // end Adornment
            },
            new go.Binding("background", "isHighlighted", function(h) {
                return h ? "rgba(255,0,0,0.2)" : "transparent";
            }).ofObject(),
            $(go.Shape, "Rectangle",
                { fill: null, strokeWidth: 2 },
                new go.Binding("stroke", "level", convertLevelColor)
            ),
            $(go.Panel, "Vertical",  // title above Placeholder
                $(go.Panel, "Horizontal",  // button next to TextBlock
                    { stretch: go.GraphObject.Horizontal },
                    new go.Binding("background", "level", convertLevelColor),
                    $("SubGraphExpanderButton",
                        { alignment: go.Spot.Right, margin: 5 } ),
                    $(go.TextBlock,
                        {
                            alignment: go.Spot.Left,
                            editable: true,
                            margin: 5,
                            font: "bold 16px sans-serif",
                            opacity: 0.75,  // allow some color to show through
                            stroke: "#404040"
                        },
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
                    // tooltip visible only when link is click event
                    new go.Binding("visible", "text", function(text) { return (text == null); }),
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
                $(go.TextBlock, { margin: 3, opacity: 1., font: "bold 14pt Courier New" },
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
            { key: "HIS5_就診明細-04_node07", img: "HIS5_就診明細-04_node07", group: "HIS5_就診明細-04", size: "192,108" },
            { key: "HIS5_就診明細-04", isGroup: true, level: 1, group: "HIS5_就診明細" },
            { key: "HIS5_就診明細-19_node01", img: "HIS5_就診明細-19_node01", group: "HIS5_就診明細-19", size: "192,108" },
            { key: "HIS5_就診明細-19_node02", img: "HIS5_就診明細-19_node02", group: "HIS5_就診明細-19", size: "192,108" },
            { key: "HIS5_就診明細-19", isGroup: true, level: 1, group: "HIS5_就診明細" },
            { key: "HIS5_就診明細-20_node00", img: "HIS5_就診明細-20_node00", group: "HIS5_就診明細-20", size: "192,78" },
            { key: "HIS5_就診明細-20", isGroup: true, level: 1, group: "HIS5_就診明細" },
            { key: "HIS5_就診明細-23_node03", img: "HIS5_就診明細-23_node03", group: "HIS5_就診明細-23", size: "192,108" },
            { key: "HIS5_就診明細-23", isGroup: true, level: 1, group: "HIS5_就診明細" },
            { key: "HIS5_就診明細-24_node00", img: "HIS5_就診明細-24_node00", group: "HIS5_就診明細-24", size: "192,56" },
            { key: "HIS5_就診明細-24_node01", img: "HIS5_就診明細-24_node01", group: "HIS5_就診明細-24", size: "192,56" },
            { key: "HIS5_就診明細-24", isGroup: true, level: 1, group: "HIS5_就診明細" },
            { key: "HIS5_就診明細-25_node14", img: "HIS5_就診明細-25_node14", group: "HIS5_就診明細-25", size: "192,108" },
            { key: "HIS5_就診明細-25", isGroup: true, level: 1, group: "HIS5_就診明細" },
            { key: "HIS5_就診明細-30_node00", img: "HIS5_就診明細-30_node00", group: "HIS5_就診明細-30", size: "192,78" },
            { key: "HIS5_就診明細-30", isGroup: true, level: 1, group: "HIS5_就診明細" },
            { key: "HIS5_就診明細-32_node15", img: "HIS5_就診明細-32_node15", group: "HIS5_就診明細-32", size: "192,108" },
            { key: "HIS5_就診明細-32", isGroup: true, level: 1, group: "HIS5_就診明細" },
            { key: "HIS5_就診明細-50_node04", img: "HIS5_就診明細-50_node04", group: "HIS5_就診明細-50", size: "192,108" },
            { key: "HIS5_就診明細-50", isGroup: true, level: 1, group: "HIS5_就診明細" },
            { key: "HIS5_就診明細", isGroup: true, level: 0 },
            { key: "group009-00_node00", img: "group009-00_node00", group: "group009-00", size: "192,108" },
            { key: "group009-00", isGroup: true, level: 1, group: "group009" },
            { key: "group009-02_node00", img: "group009-02_node00", group: "group009-02", size: "192,108" },
            { key: "group009-02", isGroup: true, level: 1, group: "group009" },
            { key: "group009-03_node00", img: "group009-03_node00", group: "group009-03", size: "192,108" },
            { key: "group009-03", isGroup: true, level: 1, group: "group009" },
            { key: "group009-04_node00", img: "group009-04_node00", group: "group009-04", size: "192,108" },
            { key: "group009-04", isGroup: true, level: 1, group: "group009" },
            { key: "group009", isGroup: true, level: 0 },
            { key: "group027-00_node00", img: "group027-00_node00", group: "group027-00", size: "192,108" },
            { key: "group027-00", isGroup: true, level: 1, group: "group027" },
            { key: "group027", isGroup: true, level: 0 },
            { key: "group029-01_node00", img: "group029-01_node00", group: "group029-01", size: "192,108" },
            { key: "group029-01", isGroup: true, level: 1, group: "group029" },
            { key: "group029", isGroup: true, level: 0 },
        ], [
            { from: "HIS5_就診明細-04_node07", to: "group009-00_node00", text: null, img: "link00", size: "78,31" },
            { from: "HIS5_就診明細-19_node01", to: "HIS5_就診明細-20_node00", text: null, img: "link01", size: "78,31" },
            { from: "HIS5_就診明細-20_node00", to: "HIS5_就診明細-19_node02", text: null, img: "link02", size: "54,24" },
            { from: "HIS5_就診明細-19_node02", to: "group009-02_node00", text: null, img: "link03", size: "78,31" },
            { from: "HIS5_就診明細-23_node03", to: "HIS5_就診明細-24_node00", text: null, img: "link04", size: "78,31" },
            { from: "HIS5_就診明細-24_node00", to: "HIS5_就診明細-24_node01", text: null, img: "link05", size: "176,50" },
            { from: "HIS5_就診明細-24_node01", to: "group009-03_node00", text: null, img: "link06", size: "176,50" },
            { from: "HIS5_就診明細-25_node14", to: "HIS5_就診明細-30_node00", text: null, img: "link07", size: "78,31" },
            { from: "HIS5_就診明細-30_node00", to: "group009-04_node00", text: null, img: "link08", size: "84,24" },
            { from: "HIS5_就診明細-32_node15", to: "group027-00_node00", text: null, img: "link09", size: "78,31" },
            { from: "HIS5_就診明細-50_node04", to: "group029-01_node00", text: null, img: "link10", size: "78,31" },
        ]);

        // initialize the Palette and its contents
        var myPalette = $(go.Palette, "myPaletteDiv",
            {
                nodeTemplateMap: myDiagram.nodeTemplateMap,
                groupTemplateMap: myDiagram.groupTemplateMap
            }
        );

        myPalette.model = new go.GraphLinksModel([
            { key: "Group", isGroup: true, level: 0 },
            { key: "Subgroup", isGroup: true, level: 1 },
        ]);

        autoExpand();
    }

    function convertLevelVisible(level) {
        if (level == 1) { return true }
        else if (level == 0) { return false }
        else { return false }
    }
    
    function convertLevelColor(level) {
        if (level == 1) { return "#FFDD33" }
        else if (level == 0) { return "#33D3E5" }
        else { return "#000000" }
    }

    function convertKeyImage(img) {
        if (img == null) return "";
        else return "imgs/20211111_141428_hong_full_seq_all/" + img + ".png";
    }

    function convertKeyFullImage(img) {
        if (img == null) return "";
        else return "imgs/20211111_141428_hong_full_seq_all/" + img + "_full.png";
    }

    function convertSize(size) {
        if (size == null) return null;
        else {
            var width = parseInt(size.split(',')[0])
            var height = parseInt(size.split(',')[1])
            return new go.Size(width, height)
        }
    }

    function convertURL(img) {
        if (img == null) return null;
        else return function() {
            window.open("imgs/20211111_141428_hong_full_seq_all/" + img + "_full.png");
        }
    }

    function inverter(x) {
        return !x;
    }

    exports.init = init;
});
