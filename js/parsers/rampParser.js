async function parseRamp() {
  let graph = null;

  await d3.csv("data/ramp.txt")
    .then(function (data) {

      graph = parseRampGraph(data);

    })
    .catch(function (error) {
      console.log(error);
    })


  return graph;
}

const EDGE_PERSIST = false;
const MAX_EVENTS = 2800;
let highestRampId = -1;
let highestRampLinkId = -1;

function parseRampGraph(lines) {


  let numEvents = 0;
  let graph = {};
  graph.timeslices = [];

  let startTime = Number.POSITIVE_INFINITY;
  let endTime = Number.NEGATIVE_INFINITY;
  let infectionDuration = 2;
  let halfDuration = infectionDuration / 2;
  let tau;


  let infectionEvents = [];
  let idToRampNode = new Map();


  lines.forEach(function (fileLine, i) {
    if (numEvents > MAX_EVENTS) return;

    let line = fileLine.data;
    if (line === "") return;

    line = line.replaceAll(" ", "");

    let firstChar = line.charAt(0);
    let isDigit = (firstChar >= '0' && firstChar <= '9');
    let isDash = firstChar === '-';
    let branch = line.split("->");


    //starts a new tree
    if (isDigit) {
      let src = new RampNode(branch[0]);
      idToRampNode.set(src.ID.toString(), src);
      let tgts = parseRampChildren(branch[1]);
      for (let j = 0; j < tgts.length; j++) {
        infectionEvents.push(new RampEdge(src, tgts[j]));
        idToRampNode.set(tgts[j].ID.toString(), tgts[j]);
        numEvents++;
      }
    } else if (isDash) {
      //continues a branch of a tree
      let src = new RampNode(branch[1]);
      idToRampNode.set(src.ID.toString(), src);
      let tgts = parseRampChildren(branch[2]);
      for (let j = 0; j < tgts.length; j++) {
        infectionEvents.push(new RampEdge(src, tgts[j]));
        idToRampNode.set(tgts[j].ID.toString(), tgts[j]);
        numEvents++;
      }
    } else {
      console.log("Syntax error in the passed file.");
    }
  });


  infectionEvents.sort(function (o1, o2) {
    if (o1 == null && o2 == null) {
      return 0;
    }
    if (o1 == null) {
      return 1;
    }
    if (o2 == null) {
      return -1;
    }
    return o1.compareTo(o2);
  });

  let nodeMap = new Map();
  let curEvent = 0;
  const fracOfTotal = 1.0 / numEvents;
  while (curEvent < numEvents) {
    let srcNode = (infectionEvents[curEvent].SRC).toString();
    let tgtNode = (infectionEvents[curEvent].TGT).toString();
    if (!nodeMap.has(srcNode)) {
      let node = {name: srcNode, group: 1}
      nodeMap.set(srcNode, node);
    }
    if (!nodeMap.has(tgtNode)) {
      let node = {name: tgtNode, group: 1}
      nodeMap.set(tgtNode, node);
    }
    let source = nodeMap.get(srcNode);
    let target = nodeMap.get(tgtNode);

   // let edge = betweenEdge(source, target, graph, getTimeSliceId(graph, infectionEvents[curEvent].TIME));

   // if (edge === null) {
     // edge = createRampLink(graph, source, target, infectionEvents[curEvent].TIME)
   // }



    let minEdgePresence = infectionEvents[curEvent].TIME - halfDuration;
    let maxEdgePresence = infectionEvents[curEvent].TIME + halfDuration;
    let minSrcNodePresence = idToRampNode.get(srcNode).TIME;
    let minTgtNodePresence = idToRampNode.get(tgtNode).TIME;


    startTime = Math.min(startTime, minSrcNodePresence);
    startTime = Math.min(startTime, minTgtNodePresence);
    startTime = Math.min(startTime, minEdgePresence);
    endTime = Math.max(endTime, maxEdgePresence);


    minTgtNodePresence = Math.min(minTgtNodePresence, minEdgePresence)

    if (!EDGE_PERSIST) {
      let srcInterval = new Interval(minSrcNodePresence, maxEdgePresence);
      let tgtInterval = new Interval(minTgtNodePresence, maxEdgePresence);
      let infectionInterval = new Interval(minEdgePresence, maxEdgePresence);
/*
      for(let i = srcInterval.start; i <= srcInterval.end; i++) {
        let id = getTimeSliceId(graph, i);
        if (id < 0) {
          id = graph.timeslices.push({tag: i, nodes: [], links: []}) - 1;
        }
        graph.timeslices[id].nodes.push({name:srcNode,group: 1, id: 0})
      }

      for(let i = tgtInterval.start; i <= tgtInterval.end; i++) {
        let id = getTimeSliceId(graph, i);
        if (id < 0) {
          id = graph.timeslices.push({tag: i, nodes: [], links: []}) - 1;
        }
        graph.timeslices[id].nodes.push({name:tgtNode,group: 1, id: 0})
      }

*/
      insertNewNode(graph, srcInterval, srcNode)
      insertNewNode(graph, tgtInterval, tgtNode)

      insertNewEdge(graph, infectionInterval, source, target)


      //presence.get(source).insert(new FunctionConst < > (srcInterval, true));
      //presence.get(target).insert(new FunctionConst < > (tgtInterval, true));
      //edgePresence.get(edge).insert(new FunctionConst < > (infectionInterval, true));

    }
    curEvent++;
  }

  /*
            if (EDGE_PERSIST) {
              curEvent = 0;
              while (curEvent < numEvents) {
                String
                srcNode = (Integer.valueOf(infectionEvents.get(curEvent).SRC)).toString();
                String
                tgtNode = (Integer.valueOf(infectionEvents.get(curEvent).TGT)).toString();
                Node
                source = nodeMap.get(srcNode);
                Node
                target = nodeMap.get(tgtNode);
                Edge
                edge = graph.betweenEdge(source, target);

                double
                minSrcNodePresence = idToRampNode.get(srcNode).TIME;
                double
                minTgtNodePresence = idToRampNode.get(tgtNode).TIME;

                Interval
                srcInterval = Interval.newRightClosed(minSrcNodePresence, endTime + halfDuration);
                Interval
                tgtInterval = Interval.newRightClosed(minTgtNodePresence, endTime + halfDuration);
                double
                minEdgePresence = infectionEvents.get(curEvent).TIME - halfDuration;

                Interval
                infectionInterval = Interval.newRightClosed(minEdgePresence, endTime + halfDuration);
                presence.get(source).insert(new FunctionConst < > (srcInterval, true));
                presence.get(target).insert(new FunctionConst < > (tgtInterval, true));
                edgePresence.get(edge).insert(new FunctionConst < > (infectionInterval, true));
                curEvent++;
              }
            }
  */

  tau = infectionDuration / endTime;
//System.out.println ("Start, end, tau: " + startTime + " " + endTime + " " + tau);
  console.log("Parsed " + numEvents + " events");
  //Commons.scatterNodes(graph, 100);
  //Commons.mergeAndColor(graph, startTime, endTime, mode, new Color(141, 211, 199), Color.BLACK, halfDuration);
  return graph;

}

class Interval {
  start;
  end
  constructor(start, end) {
    this.start = start;
    this.end = end;
  }
}

function parseRampChildren(childList) {
  childList = childList.replaceAll("[", "").replaceAll("]", "");
  let strList = childList.split(".");
  let children = [];
  for (let i = 0; i < strList.length; i++) {
    children[i] = new RampNode(strList[i]);
  }
  return children;
}

function betweenEdge(first, second, graph, id) {
  let edges = null;
  if (graph.timeslices[id]) {
    edges = graph.timeslices[id].links;
  } else {
    return null;
  }

  let e = null;
  edges.forEach(function (edge) {
    if (edge.source === first && edge.target === second || edge.source === second && edge.target === first) {
      e = edge;
    }
  });

  return e;

}

class RampNode {
  ID = null;
  TIME = null;

  constructor(formatStr) {
    let nodeAndTime = formatStr.replaceAll("(", ".").replaceAll(")", "").split(".");
    this.ID = parseInt(nodeAndTime[0]);
    this.TIME = parseInt(nodeAndTime[1]);
  }
}

class RampEdge {
  SRC = null;
  TGT = null;
  TIME = null;

  constructor(src, tgt) {
    this.SRC = src.ID;
    this.TGT = tgt.ID;
    this.TIME = tgt.TIME;
  }

  compareTo(o) {
    if (this.TIME < o.TIME)
      return -1;
    else if (this.TIME > o.TIME) {
      return 1;
    } else {
      return 0;
    }
  }
}

function insertNewNode(graph, interval, nodeName) {
  for(let time = interval.start; time <= interval.end; time++) {
    let id = getTimeSliceId(graph, time);
    if (id < 0) {
      id = graph.timeslices.push({tag: time, nodes: [], links: []}) - 1;
    }

    let nodeId = getNode(nodeName, graph);
    if (nodeId < 0) {
      nodeId = ++highestRampId;
    }

    let node = {name:nodeName,group: 1, id: nodeId};
    //console.log(graph.timeslices[id].nodes);

    //console.log(nodeId, getNodeById(graph.timeslices[id].nodes, nodeId));
    if (!getNodeById(graph.timeslices[id].nodes, nodeId)) {
      graph.timeslices[id].nodes.push(node);
    }

  }

}

function insertNewEdge(graph, interval, src, trg) {
  for(let time = interval.start; time <= interval.end; time++) {
    let id = getTimeSliceId(graph, time);
    if (id < 0) {
      id = graph.timeslices.push({tag: time, nodes: [], links: []}) - 1;
    }

    let linkId = getLink(src, trg, graph);
    if (linkId < 0) {
      linkId = ++highestRampLinkId;
    }

   // if (!getLinkById(graph.timeslices[id].nodes, linkId)) {
      graph.timeslices[id].links.push({"source": getNode(src.name, graph), "target": getNode(trg.name, graph), "value": 1, "id": linkId})
  //  }
  }

}

