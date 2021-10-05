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
            { key: "CPOE首頁-00_node00", img: "CPOE首頁-00_node00", group: "就診明細-00", size: "192,108" },
            { key: "CPOE首頁-00_node01", img: "CPOE首頁-00_node01", group: "就診明細-00", size: "192,108" },
            { key: "CPOE首頁-00_node02", img: "CPOE首頁-00_node02", group: "就診明細-00", size: "192,108" },
            { key: "就診明細-00", isGroup: true, level: 1, group: "就診明細" },
            { key: "就診明細", isGroup: true, level: 0 },
            { key: "醫囑選擇-00_node00", img: "醫囑選擇-00_node00", group: "醫囑選擇-00", size: "192,108" },
            { key: "醫囑選擇-00_node01", img: "醫囑選擇-00_node01", group: "醫囑選擇-00", size: "192,108" },
            { key: "醫囑選擇-00_node02", img: "醫囑選擇-00_node02", group: "醫囑選擇-00", size: "192,108" },
            { key: "醫囑選擇-00", isGroup: true, level: 1, group: "醫囑選擇" },
            { key: "醫囑選擇", isGroup: true, level: 0 },
        ], [
            { from: "CPOE首頁-00_node00", to: "CPOE首頁-00_node01", text: null, img: "link00", size: "96,24" },
            { from: "CPOE首頁-00_node01", to: "醫囑選擇-00_node00", text: null, img: "link01", size: "44,22" },
            { from: "醫囑選擇-00_node00", to: "醫囑選擇-00_node01", text: null, img: "link02", size: "200,13" },
            { from: "醫囑選擇-00_node01", to: "醫囑選擇-00_node02", text: "gaslan⏎", img: null, size: null },
            { from: "醫囑選擇-00_node02", to: "CPOE首頁-00_node02", text: null, img: "link04", size: "73,25" },
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
        else return "imgs/demo_seq00/" + img + ".png";
    }

    function convertKeyFullImage(img) {
        if (img == null) return "";
        else return "imgs/demo_seq00/" + img + "_full.png";
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
            window.open("imgs/demo_seq00/" + img + "_full.png");
        }
    }

    function inverter(x) {
        return !x;
    }

    exports.init = init;
});
