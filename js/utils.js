function calculateTheta(sourceNode, targetNode) {
  let dx = targetNode.x - sourceNode.x;
  let dy = targetNode.y - sourceNode.y;

  let theta = dx !== 0 ? Math.atan(dy / dx) / (Math.PI / 180.0) : dy >= 0 ? 90 : 270;
  theta = dx < 0 ? theta + 180 : dy < 0 ? theta + 360 : theta;
  theta = (theta + 45) % 360;

  return theta;
}

function updateAnchor(nodeMatrix, anchorIndex, theta, margin, anchor, pivot) {

  anchor.x = nodeMatrix.x - nodeMatrix.nodeSize / 2.0;
  anchor.y = nodeMatrix.y - nodeMatrix.nodeSize / 2.0;

  const delta = anchorIndex * nodeMatrix.nodeSize / nodeMatrix.subgraph.nodes.size + nodeMatrix.nodeSize / (2.0 * nodeMatrix.subgraph.nodes.size);

  if (theta >= 0 && theta < 90) {
    anchor.x += nodeMatrix.nodeSize;
    anchor.y += delta;
    pivot.x = anchor.x + margin * 4;
    pivot.y = anchor.y;
  }
  if (theta >= 90 && theta < 180) {
    anchor.x += delta;
    anchor.y += nodeMatrix.nodeSize;
    pivot.x = anchor.x;
    pivot.y = anchor.y + margin;
  }
  if (theta >= 180 && theta < 270) {
    anchor.y += delta;
    pivot.x = anchor.x - margin;
    pivot.y = anchor.y;
  }
  if (theta >= 270 && theta < 360) {
    anchor.x += delta;
    pivot.x = anchor.x;
    pivot.y = anchor.y - margin;
  }

}

function getNodeById(nodes, id) {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].id === id) {
      return nodes[i];
    }
  }
  return null;
}

function getNodeByName(nodes, name) {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].name === name) {
      return nodes[i];
    }
  }
  return null;
}

function getLinkBySourceTarget(links, source, target) {
  for (let i = 0; i < links.length; i++) {
    if (links[i].source === source && links[i].target === target) {
      return links[i];
    }
  }
  return null;
}

function getLinkById(links, id) {
  for (let i = 0; i < links.length; i++) {
    if (links[i].id === id) {
      return links[i];
    }
  }
  return null;
}

function getVisualNodeById(nodes, id) {
  for (let i = 0; i < nodes.length; i++) {
    let node = nodes[i];
    if ('subgraph' in node) {
      for (let j = 0; j < node.subgraph.nodes.length; j++) {
        let subnode = node.subgraph.nodes[j];
        if (subnode.id === id) {
          return subnode;
        }
      }
    } else {
      if (node.id === id) {
        return node;
      }
    }
  }
  return null;
}


function getMatrixCellsByLinkId(matrix, source, target) {
  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix.length; j++) {
      if(matrix[i][j].n1.id === source && matrix[i][j].n2.id === target) {
        return {n1: matrix[i][j], n2: matrix[j][i]};
      }
    }
  }
  return null;
}

function getLinksToNode(node, links) {
  let nodeLinks = [];
  for (let i = 0; i < links.length; i++) {
    if(links[i].source === node.id || links[i].target === node.id) {
      nodeLinks.push(links[i]);
    }
  }
  return nodeLinks;
}

function containsNode(array, node) {
  for (let n = 0; n < array.length; n++) {
    if(array[n].name === node.name) {
      return n;
    }
  }
  return -1;
}

function extractAllGroups(data) {
  this.created = [];
  let groups = [];
  for (let n = 0; n < data.timeslices.length; n++) {
    let g = data.timeslices[n];
    for (let i = 0; i < g.nodes.length; i++) {
      let node = g.nodes[i]

      if ('subgraph' in node) {
      } else {
        if (!groups.includes(node.group)) {
          groups.push(node.group);
          this.created.push(false);
        }
      }
    }
  }

  return groups;
}

function removeInvalidNodes(g, nodes) {
  let validNodes = [];

  for (let i = 0; i < nodes.length; i++) {
    if (g.nodes2.has(nodes[i])) {
      validNodes.push(nodes[i]);
    }
  }
  return validNodes;

}

function getInvalidNodes(g, nodes) {
  let invalidNodes = [];

  for (let i = 0; i < nodes.length; i++) {
    if (!g.nodes2.has(nodes[i])) {
      invalidNodes.push(nodes[i]);
    }
  }
  return invalidNodes;

}

function getTimeSliceId (graph, year) {
  let index = -1;
  graph.timeslices.forEach(function (timeSlice, i) {
    if(timeSlice.tag === year) {
      index = i;
    }
  });
  return index;
}

function createEmptyGraph() {
  let graph = {};
  graph.timeslices = [{tag:0, nodes:[], links:[]}];
  return graph;
}

function nodeIndexOf(array, node) {
  for (let i = 0; i < array.length; i++) {
    if (
      array[i].name === node.name &&
      array[i].group === node.group &&
      array[i].id === node.id
    ) {
      return i;
    }
  }
  return -1;
}

class IDFactory2 {
  ids = new Map();

  get(key) {
    if(!this.ids.has(key)) {
      this.ids.set(key, -1);
    }

    this.ids.set(key, this.ids.get(key) + 1);

    return this.ids.get(key);
  }
}

const idFactory = new IDFactory2();

const pSBC=(p,c0,c1,l)=>{
  let r,g,b,P,f,t,h,i=parseInt,m=Math.round,a=typeof(c1)=="string";
  if(typeof(p)!="number"||p<-1||p>1||typeof(c0)!="string"||(c0[0]!='r'&&c0[0]!='#')||(c1&&!a))return null;
  if(!this.pSBCr)this.pSBCr=(d)=>{
    let n=d.length,x={};
    if(n>9){
      [r,g,b,a]=d=d.split(","),n=d.length;
      if(n<3||n>4)return null;
      x.r=i(r[3]=="a"?r.slice(5):r.slice(4)),x.g=i(g),x.b=i(b),x.a=a?parseFloat(a):-1
    }else{
      if(n==8||n==6||n<4)return null;
      if(n<6)d="#"+d[1]+d[1]+d[2]+d[2]+d[3]+d[3]+(n>4?d[4]+d[4]:"");
      d=i(d.slice(1),16);
      if(n==9||n==5)x.r=d>>24&255,x.g=d>>16&255,x.b=d>>8&255,x.a=m((d&255)/0.255)/1000;
      else x.r=d>>16,x.g=d>>8&255,x.b=d&255,x.a=-1
    }return x};
  h=c0.length>9,h=a?c1.length>9?true:c1=="c"?!h:false:h,f=this.pSBCr(c0),P=p<0,t=c1&&c1!="c"?this.pSBCr(c1):P?{r:0,g:0,b:0,a:-1}:{r:255,g:255,b:255,a:-1},p=P?p*-1:p,P=1-p;
  if(!f||!t)return null;
  if(l)r=m(P*f.r+p*t.r),g=m(P*f.g+p*t.g),b=m(P*f.b+p*t.b);
  else r=m((P*f.r**2+p*t.r**2)**0.5),g=m((P*f.g**2+p*t.g**2)**0.5),b=m((P*f.b**2+p*t.b**2)**0.5);
  a=f.a,t=t.a,f=a>=0||t>=0,a=f?a<0?t:t<0?a:a*P+t*p:0;
  if(h)return"rgb"+(f?"a(":"(")+r+","+g+","+b+(f?","+m(a*1000)/1000:"")+")";
  else return"#"+(4294967296+r*16777216+g*65536+b*256+(f?m(a*255):0)).toString(16).slice(1,f?undefined:-2)
}

function hexToRgba(hex, a) {
  let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? "rgba(" +
    parseInt(result[1], 16) + "," +
    parseInt(result[2], 16) + "," +
    parseInt(result[3], 16) + "," +
    a + ")"
    : null;
}

class ColorFactory {
  nextCol = 1;

  genColor() {
    let ret = [];
    if (this.nextCol < 16777215) {
      ret.push(this.nextCol & 0xff);
      ret.push((this.nextCol & 0xff00) >> 8);
      ret.push((this.nextCol & 0xff0000) >> 16);
      this.nextCol += 12;
    }
    return "rgb(" + ret.join(',') + ")";
  }
}

const colorFactory = new ColorFactory();

function sortIntoMiddle(order) {
  let newOrder = [];
  let forward = 0;
  let backward = 1;

  for(let i = 0; i < order.length; i++) {
    if(i % 2 === 0) {
      newOrder[forward] = order[i];
      forward++;
    } else {
      newOrder[order.length-backward] = order[i];
      backward++;
    }
  }

  return newOrder;

}

function padString(str, len) {
  let string = str + "";
  while(string.length < len) {
    string += " ";
  }
  return string;
}

function clamp(x, lo, hi) {
  return x < lo ? lo : x > hi ? hi : x;
}
