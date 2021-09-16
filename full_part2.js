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
                mouseDrop: function(e, node) { mergeNode(e, node); }
            },
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
            { key: "group00node01", img: "group00node01", group: "Group0", size: "192,106" },
            { key: "Group1", isGroup: true },
            { key: "group01node00", img: "group01node00", group: "Group1", size: "192,108" },
            { key: "group01node01", img: "group01node01", group: "Group1", size: "192,108" },
            { key: "group01node02", img: "group01node02", group: "Group1", size: "192,108" },
            { key: "group01node03", img: "group01node03", group: "Group1", size: "190,108" },
            { key: "group01node04", img: "group01node04", group: "Group1", size: "192,108" },
            { key: "group01node05", img: "group01node05", group: "Group1", size: "192,98" },
            { key: "Group2", isGroup: true },
            { key: "group02node00", img: "group02node00", group: "Group2", size: "192,108" },
            { key: "group02node01", img: "group02node01", group: "Group2", size: "192,108" },
            { key: "group02node02", img: "group02node02", group: "Group2", size: "192,108" },
            { key: "group02node03", img: "group02node03", group: "Group2", size: "192,82" },
            { key: "group02node04", img: "group02node04", group: "Group2", size: "192,108" },
            { key: "group02node05", img: "group02node05", group: "Group2", size: "192,108" },
            { key: "group02node06", img: "group02node06", group: "Group2", size: "192,108" },
            { key: "group02node07", img: "group02node07", group: "Group2", size: "192,108" },
            { key: "group02node08", img: "group02node08", group: "Group2", size: "192,108" },
            { key: "group02node09", img: "group02node09", group: "Group2", size: "192,108" },
            { key: "Group3", isGroup: true },
            { key: "group03node00", img: "group03node00", group: "Group3", size: "192,108" },
            { key: "group03node01", img: "group03node01", group: "Group3", size: "192,82" },
            { key: "group03node02", img: "group03node02", group: "Group3", size: "192,82" },
            { key: "group03node03", img: "group03node03", group: "Group3", size: "192,108" },
            { key: "group03node04", img: "group03node04", group: "Group3", size: "192,82" },
            { key: "group03node05", img: "group03node05", group: "Group3", size: "192,108" },
            { key: "group03node06", img: "group03node06", group: "Group3", size: "192,82" },
            { key: "group03node07", img: "group03node07", group: "Group3", size: "192,108" },
            { key: "group03node08", img: "group03node08", group: "Group3", size: "192,82" },
            { key: "group03node09", img: "group03node09", group: "Group3", size: "192,98" },
            { key: "Group4", isGroup: true },
            { key: "group04node00", img: "group04node00", group: "Group4", size: "192,108" },
            { key: "group04node01", img: "group04node01", group: "Group4", size: "192,82" },
            { key: "group04node02", img: "group04node02", group: "Group4", size: "192,108" },
            { key: "group04node03", img: "group04node03", group: "Group4", size: "192,108" },
            { key: "group04node04", img: "group04node04", group: "Group4", size: "192,82" },
            { key: "group04node05", img: "group04node05", group: "Group4", size: "192,108" },
            { key: "group04node06", img: "group04node06", group: "Group4", size: "192,108" },
            { key: "group04node07", img: "group04node07", group: "Group4", size: "192,82" },
            { key: "group04node08", img: "group04node08", group: "Group4", size: "192,108" },
            { key: "group04node09", img: "group04node09", group: "Group4", size: "192,108" },
            { key: "group04node10", img: "group04node10", group: "Group4", size: "192,82" },
            { key: "Group5", isGroup: true },
            { key: "group05node00", img: "group05node00", group: "Group5", size: "192,108" },
            { key: "Group6", isGroup: true },
            { key: "group06node00", img: "group06node00", group: "Group6", size: "192,108" },
            { key: "Group7", isGroup: true },
            { key: "group07node00", img: "group07node00", group: "Group7", size: "192,108" },
            { key: "group07node01", img: "group07node01", group: "Group7", size: "192,82" },
            { key: "group07node02", img: "group07node02", group: "Group7", size: "192,108" },
            { key: "group07node03", img: "group07node03", group: "Group7", size: "192,108" },
            { key: "group07node04", img: "group07node04", group: "Group7", size: "192,108" },
            { key: "group07node05", img: "group07node05", group: "Group7", size: "192,108" },
            { key: "Group8", isGroup: true },
            { key: "group08node00", img: "group08node00", group: "Group8", size: "142,108" },
            { key: "Group9", isGroup: true },
            { key: "group09node00", img: "group09node00", group: "Group9", size: "192,100" },
            { key: "group09node01", img: "group09node01", group: "Group9", size: "192,108" },
            { key: "group09node02", img: "group09node02", group: "Group9", size: "192,108" },
            { key: "group09node03", img: "group09node03", group: "Group9", size: "192,82" },
            { key: "Group10", isGroup: true },
            { key: "group10node00", img: "group10node00", group: "Group10", size: "192,108" },
            { key: "group10node01", img: "group10node01", group: "Group10", size: "192,82" },
            { key: "Group11", isGroup: true },
            { key: "group11node00", img: "group11node00", group: "Group11", size: "4,6" },
            { key: "group11node01", img: "group11node01", group: "Group11", size: "4,3" },
            { key: "Group12", isGroup: true },
            { key: "group12node00", img: "group12node00", group: "Group12", size: "192,108" },
            { key: "group12node01", img: "group12node01", group: "Group12", size: "192,82" },
            { key: "Group13", isGroup: true },
            { key: "group13node00", img: "group13node00", group: "Group13", size: "192,108" },
            { key: "group13node01", img: "group13node01", group: "Group13", size: "192,108" },
            { key: "group13node02", img: "group13node02", group: "Group13", size: "192,82" },
            { key: "Group14", isGroup: true },
            { key: "group14node00", img: "group14node00", group: "Group14", size: "101,108" },
            { key: "group14node01", img: "group14node01", group: "Group14", size: "192,108" },
            { key: "group14node02", img: "group14node02", group: "Group14", size: "97,108" },
            { key: "Group15", isGroup: true },
            { key: "group15node00", img: "group15node00", group: "Group15", size: "192,108" },
            { key: "group15node01", img: "group15node01", group: "Group15", size: "192,82" },
            { key: "Group16", isGroup: true },
            { key: "group16node00", img: "group16node00", group: "Group16", size: "192,108" },
            { key: "group16node01", img: "group16node01", group: "Group16", size: "192,82" },
            { key: "Group17", isGroup: true },
            { key: "group17node00", img: "group17node00", group: "Group17", size: "192,108" },
            { key: "group17node01", img: "group17node01", group: "Group17", size: "192,82" },
            { key: "group17node02", img: "group17node02", group: "Group17", size: "192,108" },
            { key: "Group18", isGroup: true },
            { key: "group18node00", img: "group18node00", group: "Group18", size: "192,108" },
            { key: "group18node01", img: "group18node01", group: "Group18", size: "192,82" },
            { key: "Group19", isGroup: true },
            { key: "group19node00", img: "group19node00", group: "Group19", size: "192,108" },
            { key: "group19node01", img: "group19node01", group: "Group19", size: "79,108" },
            { key: "Group20", isGroup: true },
            { key: "group20node00", img: "group20node00", group: "Group20", size: "192,80" },
            { key: "Group21", isGroup: true },
            { key: "group21node00", img: "group21node00", group: "Group21", size: "192,108" },
            { key: "Group22", isGroup: true },
            { key: "group22node00", img: "group22node00", group: "Group22", size: "192,108" },
            { key: "group22node01", img: "group22node01", group: "Group22", size: "192,82" },
            { key: "Group23", isGroup: true },
            { key: "group23node00", img: "group23node00", group: "Group23", size: "192,96" },
            { key: "Group24", isGroup: true },
            { key: "group24node00", img: "group24node00", group: "Group24", size: "192,108" },
            { key: "group24node01", img: "group24node01", group: "Group24", size: "192,108" },
            { key: "Group25", isGroup: true },
            { key: "group25node00", img: "group25node00", group: "Group25", size: "192,108" },
            { key: "Group26", isGroup: true },
            { key: "group26node00", img: "group26node00", group: "Group26", size: "192,108" },
            { key: "Group27", isGroup: true },
            { key: "group27node00", img: "group27node00", group: "Group27", size: "192,108" },
            { key: "Group28", isGroup: true },
            { key: "group28node00", img: "group28node00", group: "Group28", size: "192,105" },
            { key: "group28node01", img: "group28node01", group: "Group28", size: "192,108" },
            { key: "Group29", isGroup: true },
            { key: "group29node00", img: "group29node00", group: "Group29", size: "192,108" },
            { key: "group29node01", img: "group29node01", group: "Group29", size: "192,108" },
            { key: "Group30", isGroup: true },
            { key: "group30node00", img: "group30node00", group: "Group30", size: "192,108" },
            { key: "Group31", isGroup: true },
            { key: "group31node00", img: "group31node00", group: "Group31", size: "192,108" },
            { key: "Group32", isGroup: true },
            { key: "group32node00", img: "group32node00", group: "Group32", size: "192,99" },
            { key: "Group33", isGroup: true },
            { key: "group33node00", img: "group33node00", group: "Group33", size: "192,108" },
            { key: "Group34", isGroup: true },
            { key: "group34node00", img: "group34node00", group: "Group34", size: "192,108" },
            { key: "Group35", isGroup: true },
            { key: "group35node00", img: "group35node00", group: "Group35", size: "192,108" },
            { key: "group35node01", img: "group35node01", group: "Group35", size: "192,108" },
            { key: "group35node02", img: "group35node02", group: "Group35", size: "192,108" },
        ], [
            { from: "group00node00", to: "group01node00", img: "link00", size: "31,16" },
            { from: "group01node00", to: "group01node00", img: "link01", size: "96,24" },
            { from: "group01node00", to: "group02node00", img: "link02", size: "76,24" },
            { from: "group02node00", to: "group02node01", img: "link03", size: "200,14" },
            { from: "group02node01", to: "group03node00", img: "link04", size: "30,19" },
            { from: "group03node00", to: "group03node00", img: "link05", size: "200,12" },
            { from: "group03node00", to: "group03node00", img: "link06", size: "150,30" },
            { from: "group03node00", to: "group03node01", img: "link07", size: "31,16" },
            { from: "group03node01", to: "group01node00", img: "link08", size: "52,20" },
            { from: "group02node01", to: "group04node00", img: "link09", size: "30,19" },
            { from: "group04node00", to: "group04node00", img: "link10", size: "140,21" },
            { from: "group04node00", to: "group04node01", img: "link11", size: "31,16" },
            { from: "group04node01", to: "group01node00", img: "link12", size: "52,20" },
            { from: "group01node00", to: "group01node00", img: "link13", size: "100,28" },
            { from: "group02node01", to: "group02node02", img: "link14", size: "29,19" },
            { from: "group02node02", to: "group02node02", img: "link15", size: "151,30" },
            { from: "group02node02", to: "group02node03", img: "link16", size: "31,16" },
            { from: "group02node03", to: "group01node00", img: "link17", size: "52,20" },
            { from: "group01node00", to: "group05node00", img: "link18", size: "76,24" },
            { from: "group05node00", to: "group02node04", img: "link19", size: "200,14" },
            { from: "group02node04", to: "group01node00", img: "link20", size: "30,19" },
            { from: "group01node00", to: "group01node00", img: "link21", size: "200,21" },
            { from: "group01node00", to: "group02node05", img: "link22", size: "39,24" },
            { from: "group02node05", to: "group03node02", img: "link23", size: "81,30" },
            { from: "group03node02", to: "group01node01", img: "link24", size: "52,20" },
            { from: "group01node01", to: "group01node00", img: "link25", size: "100,28" },
            { from: "group01node00", to: "group06node00", img: "link26", size: "42,24" },
            { from: "group06node00", to: "group02node04", img: "link27", size: "200,14" },
            { from: "group01node00", to: "group01node02", img: "link28", size: "22,23" },
            { from: "group01node02", to: "group03node03", img: "link29", size: "39,24" },
            { from: "group03node03", to: "group03node04", img: "link30", size: "81,30" },
            { from: "group03node04", to: "group01node01", img: "link31", size: "52,20" },
            { from: "group02node01", to: "group04node02", img: "link32", size: "30,19" },
            { from: "group04node02", to: "group04node02", img: "link33", size: "200,22" },
            { from: "group04node02", to: "group03node05", img: "link34", size: "32,21" },
            { from: "group03node05", to: "group03node05", img: "link35", size: "94,50" },
            { from: "group03node05", to: "group04node02", img: "link36", size: "29,19" },
            { from: "group04node02", to: "group04node02", img: "link37", size: "200,11" },
            { from: "group04node02", to: "group03node05", img: "link38", size: "31,16" },
            { from: "group03node05", to: "group01node00", img: "link39", size: "52,20" },
            { from: "group02node01", to: "group01node00", img: "link40", size: "30,19" },
            { from: "group01node00", to: "group02node06", img: "link41", size: "39,24" },
            { from: "group02node06", to: "group02node06", img: "link42", size: "151,30" },
            { from: "group02node06", to: "group02node06", img: "link43", size: "147,27" },
            { from: "group02node06", to: "group02node06", img: "link44", size: "149,30" },
            { from: "group02node06", to: "group03node02", img: "link45", size: "81,30" },
            { from: "group03node02", to: "group01node02", img: "link46", size: "52,20" },
            { from: "group01node02", to: "group01node00", img: "link47", size: "100,28" },
            { from: "group01node00", to: "group02node07", img: "link48", size: "76,24" },
            { from: "group02node07", to: "group02node04", img: "link49", size: "200,14" },
            { from: "group02node04", to: "group07node00", img: "link50", size: "30,19" },
            { from: "group07node00", to: "group07node01", img: "link51", size: "200,11" },
            { from: "group07node01", to: "group07node00", img: "link52", size: "73,25" },
            { from: "group07node00", to: "group07node02", img: "link53", size: "200,11" },
            { from: "group07node02", to: "group07node03", img: "link54", size: "102,21" },
            { from: "group07node03", to: "group08node00", img: "link55", size: "200,11" },
            { from: "group08node00", to: "group07node03", img: "link56", size: "34,30" },
            { from: "group07node03", to: "group07node03", img: "link57", size: "200,12" },
            { from: "group07node03", to: "group07node03", img: "link58", size: "200,13" },
            { from: "group07node03", to: "group09node00", img: "link59", size: "35,20" },
            { from: "group09node00", to: "group09node00", img: "link60", size: "96,50" },
            { from: "group09node00", to: "group09node01", img: "link61", size: "27,19" },
            { from: "group09node01", to: "group09node02", img: "link62", size: "200,12" },
            { from: "group09node02", to: "group09node02", img: "link63", size: "200,11" },
            { from: "group09node02", to: "group09node03", img: "link64", size: "31,16" },
            { from: "group09node03", to: "group01node00", img: "link65", size: "52,20" },
            { from: "group02node01", to: "group04node03", img: "link66", size: "30,19" },
            { from: "group04node03", to: "group04node03", img: "link67", size: "140,21" },
            { from: "group04node03", to: "group04node04", img: "link68", size: "31,16" },
            { from: "group04node04", to: "group01node00", img: "link69", size: "52,20" },
            { from: "group02node00", to: "group02node04", img: "link70", size: "200,14" },
            { from: "group02node04", to: "group10node00", img: "link71", size: "30,19" },
            { from: "group10node00", to: "group10node01", img: "link72", size: "31,16" },
            { from: "group10node01", to: "group01node00", img: "link73", size: "52,20" },
            { from: "group03node00", to: "group03node00", img: "link74", size: "200,20" },
            { from: "group03node00", to: "group03node00", img: "link75", size: "149,29" },
            { from: "group03node00", to: "group01node00", img: "link76", size: "31,16" },
            { from: "group01node00", to: "group01node00", img: "link77", size: "106,50" },
            { from: "group01node00", to: "group11node00", img: "link78", size: "42,24" },
            { from: "group11node00", to: "group02node01", img: "link79", size: "200,14" },
            { from: "group02node01", to: "group04node05", img: "link80", size: "29,19" },
            { from: "group04node05", to: "group03node06", img: "link81", size: "31,16" },
            { from: "group03node06", to: "group01node00", img: "link82", size: "52,20" },
            { from: "group02node01", to: "group12node00", img: "link83", size: "28,19" },
            { from: "group12node00", to: "group12node01", img: "link84", size: "31,16" },
            { from: "group12node01", to: "group01node00", img: "link85", size: "52,20" },
            { from: "group11node00", to: "group02node04", img: "link86", size: "200,14" },
            { from: "group02node04", to: "group04node06", img: "link87", size: "30,19" },
            { from: "group04node06", to: "group04node07", img: "link88", size: "31,16" },
            { from: "group04node07", to: "group01node00", img: "link89", size: "52,20" },
            { from: "group02node01", to: "group13node00", img: "link90", size: "30,19" },
            { from: "group13node00", to: "group13node00", img: "link91", size: "200,7" },
            { from: "group13node00", to: "group13node01", img: "link92", size: "200,8" },
            { from: "group13node01", to: "group13node01", img: "link93", size: "200,12" },
            { from: "group13node01", to: "group13node00", img: "link94", size: "33,20" },
            { from: "group13node00", to: "group13node01", img: "link95", size: "200,13" },
            { from: "group13node01", to: "group13node00", img: "link96", size: "200,12" },
            { from: "group13node00", to: "group13node00", img: "link97", size: "147,27" },
            { from: "group13node00", to: "group13node02", img: "link98", size: "31,16" },
            { from: "group13node02", to: "group01node00", img: "link99", size: "52,20" },
            { from: "group11node00", to: "group14node00", img: "link100", size: "200,14" },
            { from: "group14node00", to: "group02node04", img: "link101", size: "73,26" },
            { from: "group02node04", to: "group02node01", img: "link102", size: "94,50" },
            { from: "group02node01", to: "group04node08", img: "link103", size: "29,19" },
            { from: "group04node08", to: "group04node08", img: "link104", size: "200,12" },
            { from: "group04node08", to: "group04node08", img: "link105", size: "33,20" },
            { from: "group04node08", to: "group04node08", img: "link106", size: "200,13" },
            { from: "group04node08", to: "group04node08", img: "link107", size: "200,12" },
            { from: "group04node08", to: "group04node08", img: "link108", size: "147,27" },
            { from: "group04node08", to: "group04node07", img: "link109", size: "31,16" },
            { from: "group02node01", to: "group15node00", img: "link110", size: "30,19" },
            { from: "group15node00", to: "group15node01", img: "link111", size: "31,16" },
            { from: "group15node01", to: "group01node00", img: "link112", size: "52,20" },
            { from: "group02node04", to: "group03node07", img: "link113", size: "30,19" },
            { from: "group03node07", to: "group03node07", img: "link114", size: "149,29" },
            { from: "group03node07", to: "group03node08", img: "link115", size: "31,16" },
            { from: "group03node08", to: "group01node00", img: "link116", size: "52,20" },
            { from: "group02node00", to: "group14node01", img: "link117", size: "200,14" },
            { from: "group14node01", to: "group16node00", img: "link118", size: "28,19" },
            { from: "group16node00", to: "group16node01", img: "link119", size: "31,16" },
            { from: "group16node01", to: "group01node00", img: "link120", size: "52,20" },
            { from: "group02node04", to: "group17node00", img: "link121", size: "30,19" },
            { from: "group17node00", to: "group17node00", img: "link122", size: "147,26" },
            { from: "group17node00", to: "group17node01", img: "link123", size: "31,16" },
            { from: "group17node01", to: "group01node00", img: "link124", size: "52,20" },
            { from: "group02node06", to: "group02node06", img: "link125", size: "151,31" },
            { from: "group02node04", to: "group04node09", img: "link126", size: "30,19" },
            { from: "group04node09", to: "group04node09", img: "link127", size: "149,31" },
            { from: "group04node09", to: "group04node09", img: "link128", size: "140,21" },
            { from: "group04node09", to: "group04node09", img: "link129", size: "200,13" },
            { from: "group04node09", to: "group04node10", img: "link130", size: "31,16" },
            { from: "group04node10", to: "group01node00", img: "link131", size: "52,20" },
            { from: "group02node06", to: "group02node06", img: "link132", size: "151,30" },
            { from: "group02node01", to: "group12node00", img: "link133", size: "30,19" },
            { from: "group12node00", to: "group12node00", img: "link134", size: "200,13" },
            { from: "group07node00", to: "group18node00", img: "link135", size: "136,50" },
            { from: "group18node00", to: "group18node01", img: "link136", size: "31,16" },
            { from: "group18node01", to: "group01node00", img: "link137", size: "52,20" },
            { from: "group01node00", to: "group19node00", img: "link138", size: "200,3" },
            { from: "group19node00", to: "group19node00", img: "link139", size: "118,24" },
            { from: "group19node00", to: "group19node01", img: "link140", size: "42,28" },
            { from: "group19node01", to: "group20node00", img: "link141", size: "63,20" },
            { from: "group20node00", to: "group20node00", img: "link142", size: "200,12" },
            { from: "group20node00", to: "group21node00", img: "link143", size: "58,24" },
            { from: "group21node00", to: "group02node00", img: "link144", size: "76,24" },
            { from: "group02node00", to: "group14node02", img: "link145", size: "200,14" },
            { from: "group14node02", to: "group14node02", img: "link146", size: "73,26" },
            { from: "group14node02", to: "group02node04", img: "link147", size: "84,20" },
            { from: "group02node04", to: "group22node00", img: "link148", size: "29,19" },
            { from: "group22node00", to: "group22node01", img: "link149", size: "31,16" },
            { from: "group22node01", to: "group21node00", img: "link150", size: "52,20" },
            { from: "group21node00", to: "group19node00", img: "link151", size: "200,3" },
            { from: "group19node00", to: "group20node00", img: "link152", size: "42,28" },
            { from: "group20node00", to: "group01node00", img: "link153", size: "58,24" },
            { from: "group06node00", to: "group23node00", img: "link154", size: "200,14" },
            { from: "group23node00", to: "group02node08", img: "link155", size: "34,30" },
            { from: "group02node08", to: "group01node00", img: "link156", size: "30,19" },
            { from: "group01node00", to: "group01node03", img: "link157", size: "78,28" },
            { from: "group01node03", to: "group01node04", img: "link158", size: "22,20" },
            { from: "group01node04", to: "group19node00", img: "link159", size: "200,3" },
            { from: "group20node00", to: "group24node00", img: "link160", size: "58,24" },
            { from: "group24node00", to: "group24node01", img: "link161", size: "100,28" },
            { from: "group24node01", to: "group02node00", img: "link162", size: "76,24" },
            { from: "group02node04", to: "group24node01", img: "link163", size: "30,19" },
            { from: "group24node01", to: "group19node00", img: "link164", size: "200,3" },
            { from: "group01node00", to: "group00node00", img: "link165", size: "44,23" },
            { from: "group00node00", to: "group00node01", img: "link166", size: "101,50" },
            { from: "group00node01", to: "group25node00", img: "link167", size: "77,28" },
            { from: "group25node00", to: "group03node09", img: "link168", size: "79,30" },
            { from: "group03node09", to: "group03node09", img: "link169", size: "73,26" },
            { from: "group03node09", to: "group02node09", img: "link170", size: "73,26" },
            { from: "group02node09", to: "group03node09", img: "link171", size: "31,16" },
            { from: "group03node09", to: "group01node00", img: "link172", size: "52,20" },
            { from: "group01node00", to: "group26node00", img: "link173", size: "138,26" },
            { from: "group26node00", to: "group11node01", img: "link174", size: "200,25" },
            { from: "group11node01", to: "group27node00", img: "link175", size: "200,22" },
            { from: "group27node00", to: "group28node00", img: "link176", size: "200,12" },
            { from: "group28node00", to: "group28node01", img: "link177", size: "83,35" },
            { from: "group28node01", to: "group29node00", img: "link178", size: "29,19" },
            { from: "group29node00", to: "group29node01", img: "link179", size: "118,50" },
            { from: "group29node01", to: "group01node00", img: "link180", size: "29,19" },
            { from: "group02node04", to: "group07node04", img: "link181", size: "30,19" },
            { from: "group07node04", to: "group07node05", img: "link182", size: "200,13" },
            { from: "group07node05", to: "group07node04", img: "link183", size: "200,12" },
            { from: "group07node04", to: "group01node00", img: "link184", size: "29,19" },
            { from: "group01node03", to: "group19node00", img: "link185", size: "21,19" },
            { from: "group19node00", to: "group30node00", img: "link186", size: "200,3" },
            { from: "group30node00", to: "group30node00", img: "link187", size: "200,3" },
            { from: "group30node00", to: "group19node00", img: "link188", size: "200,3" },
            { from: "group01node00", to: "group01node01", img: "link189", size: "106,50" },
            { from: "group01node01", to: "group01node03", img: "link190", size: "78,28" },
            { from: "group19node00", to: "group19node00", img: "link191", size: "138,25" },
            { from: "group02node01", to: "group31node00", img: "link192", size: "79,30" },
            { from: "group31node00", to: "group31node00", img: "link193", size: "200,27" },
            { from: "group31node00", to: "group01node00", img: "link194", size: "30,19" },
            { from: "group01node00", to: "group32node00", img: "link195", size: "78,28" },
            { from: "group32node00", to: "group01node03", img: "link196", size: "92,25" },
            { from: "group01node00", to: "group01node02", img: "link197", size: "23,24" },
            { from: "group01node02", to: "group33node00", img: "link198", size: "62,50" },
            { from: "group33node00", to: "group01node00", img: "link199", size: "64,30" },
            { from: "group17node00", to: "group17node00", img: "link200", size: "200,33" },
            { from: "group17node00", to: "group17node00", img: "link201", size: "194,50" },
            { from: "group17node00", to: "group01node00", img: "link202", size: "30,19" },
            { from: "group01node00", to: "group34node00", img: "link203", size: "106,50" },
            { from: "group34node00", to: "group34node00", img: "link204", size: "200,8" },
            { from: "group34node00", to: "group01node05", img: "link205", size: "96,28" },
            { from: "group01node05", to: "group17node02", img: "link206", size: "58,24" },
            { from: "group17node02", to: "group01node00", img: "link207", size: "29,19" },
            { from: "group01node00", to: "group01node02", img: "link208", size: "200,19" },
            { from: "group01node02", to: "group35node00", img: "link209", size: "78,27" },
            { from: "group35node00", to: "group35node01", img: "link210", size: "116,28" },
            { from: "group35node01", to: "group35node02", img: "link211", size: "200,3" },
            { from: "group35node02", to: "group01node00", img: "link212", size: "195,28" },
            { from: "group01node00", to: "group01node04", img: "link213", size: "20,22" },
            { from: "group01node04", to: "group01node03", img: "link214", size: "78,28" },
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
        return "imgs/full_part2/" + img + ".png";
    }

    function convertSize(size) {
        var width = parseInt(size.split(',')[0])
        var height = parseInt(size.split(',')[1])
        return new go.Size(width, height)
    }

    exports.init = init;
});
