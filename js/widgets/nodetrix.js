class NodeTrix {
  cfg = {};
  data = {};
  visualGraph = {};
  logicalGraph = {};

  simulation = null;

 // svg = null;
  node = null;
  link = null;
  text = null;
  matrix = null;
  bridge = null;

  path = null;

  clustersView = null;
  timelineView = null;
  clusteringView = null;
  clusteringController = null;
  reorderingView = null;
  reorderingController = null;

  matrixDragHandler = new DragHandler();
  dragHandler = new DragHandler();
  zoomHandler = new ZoomHandler();

  clusters = [];
  viewbridges = [];
  submatrix = [];
  viewmatrix = [];

  index = {};

  context = null;
  transform = {x:0, y:0, k:1};
  oldTransform = {x:0, y:0, k:1};

  w;
  h;

  nextCol = 1;

  mouseX = 0;
  mouseY = 0;

  hoveredNodes = [];
  highlightedNodes = [];
  selectedNodes = [];

  shiftKeyPressed = false;
  lassoKeyPressed = false;

  interacting = false;

  colorToMatrix = new Map();
  colorToMatrixCell = new Map();

  nodeVolS = 0;
  nodeVolM = 0;
  nodeVolL = 0;

  circlingAngle = 0;
  circlingRadius = 3;
  circlingSpeed = 12;

  highlightNew = false;
  highlightLeaving = true;

  lassoPoints = [];
  lassoStart = {};

  constructor(w, h, cfg) {
    this.cfg = cfg;
    let _this = this;


    let container = d3.select('#vis')

    let graphCanvas = d3.select('#canvas')
      .attr('width', 100 + '%')
      .attr('height', 100 + '%')
      .node();

    graphCanvas.width  = graphCanvas.offsetWidth;
    graphCanvas.height = graphCanvas.offsetHeight;

    this.w = graphCanvas.offsetWidth;
    this.h = graphCanvas.offsetHeight;

    let hiddenCanvas = d3.select('#hiddencanvas')
    hiddenCanvas.width  = this.w
    hiddenCanvas.height = this.h;

    this.context = graphCanvas.getContext('2d', { willReadFrequently: true});

    this.hiddenContext = graphCanvas.getContext('2d', { willReadFrequently: true, alpha: false});

    d3.select(graphCanvas).call(d3.zoom()
      .scaleExtent([0.1, 3])
      .on("start", _this.zoomstart.bind(_this))
      .on("end", _this.zoomend.bind(_this))
      .on("zoom", _this.zoompan.bind(_this)));

    let update = function () {
      return function (i, nodes) {
        if (i % 30 === 0) {
          return true;
        } else {
          return false;
        }
      };
    }

    this.simulation = d3.forceSimulation()
      .velocityDecay(0.56)
      .force("charge", d3.forceManyBody().strength(d => d.charge).distanceMin(13).theta(1.2))

      .force("link", d3.forceLink().id(d => d.id).distance(d => d.distance).strength(d => d.strength))
      .force('center', d3.forceCenter(this.w / 2, this.h / 2))
      .force('forceX', d3.forceX().x(this.w * 0.5))
      .force('forceY', d3.forceY().y(this.h * 0.5))
      .force('collide', d3.forceCollide().radius(d => d.radius));

    document.getElementById("matrixButton").onclick = function () {
      let cluster = [];
      _this.selectedNodes.forEach(function (node) {
        cluster.push(node.id);
      });
      _this.createMatrix(cluster, null, undefined, undefined);
      _this.unselect();
    }

    document.getElementById("unselectButton").onclick = function () {
      _this.unselect();
    }

    document.addEventListener('keydown', (event) => {
      const keyName = event.key;
      if (keyName === 'Shift') {
        _this.shiftKeyPressed = true;
      } else if (keyName === 'x') {
        _this.lassoKeyPressed = true;
      }
    }, false);

    document.addEventListener('keyup', (event) => {
      const keyName = event.key;
      if (keyName === 'Shift') {
        _this.shiftKeyPressed = false;
      } else if (keyName === 'x') {
        _this.lassoKeyPressed = false;
      }
    }, false);


    this.path = d3.geoPath().context(this.context);

  }


  setClustersView(clustersView) {
    this.clustersView = clustersView;
    clustersView.setGraph(this);
    return this;
  }

  setTimelineView(timelineView) {
    this.timelineView = timelineView;
    timelineView.setGraph(this);
    return this;
  }

  setClusteringController(clusteringController) {
    this.clusteringController = clusteringController;
    return this;
  }

  setClusteringView(clusteringView) {
    this.clusteringView = clusteringView;
    clusteringView.setGraph(this);
    return this;
  }

  setReorderingController(reorderingController) {
    this.reorderingController = reorderingController;
    return this;
  }

  setReorderingView(reorderingView) {
    this.reorderingView = reorderingView;
    reorderingView.setGraph(this);
    return this;
  }

  setup(data, timeSlice) {
    let _this = this;
    this.data = data;
    this.clusters = this.clusteringController.initializeClusters(data);

    this.logicalGraph = data.timeslices[timeSlice];
    this.visualGraph = this.data.combinedGraph;

    this.timelineView.setup(data);
    this.zoomHandler.setup(this.context);
    this.matrixDragHandler.setup(this.simulation);
    this.dragHandler.setup(this.simulation);

    this.setTimeSlice(timeSlice);
    this.update(0.5);

    window.requestAnimationFrame(this.step.bind(this));


    d3.select('#canvas').on('mousemove', function (event) {
      let coords = _this.getMousePos(this, event)
      _this.mouseX = coords.x;
      _this.mouseY = coords.y;
      _this.hiddenStep();
      let node = _this.getHoveringNode(_this.mouseX, _this.mouseY);
      if(node) {
        if(_this.shiftKeyPressed) {
          _this.hoverCluster(node.cluster);
        } else {
          _this.unhover();
          _this.hoverNode(node);
        }
      } else {
        _this.unhover();
      }
    });


    this.visualGraph.nodes.forEach(function (node) {
      _this.calculateRadius(node);
    });

    setInterval( function () {
      _this.circlingAngle += Math.PI / 180 * _this.circlingSpeed;
    }, 20);

  }

  calculateRadius(node) {
    if (node.volatility <= 0) {
      node.radius = this.cfg.node.radiusL;
    } else if (node.volatility <= this.data.highestVolatility * 0.66) {
      node.radius = this.cfg.node.radiusM;
    } else{
      node.radius = this.cfg.node.radiusS;
    }
  }

  zoomstart(event) {
    this.hiddenStep();

   if(event.sourceEvent.buttons === 1) {

     let canvas = document.querySelector('#canvas');
     let coords = this.getMousePos(canvas, event.sourceEvent);
     let invertedScale = 1/ this.transform.k
     this.mouseX = invertedScale * coords.x - invertedScale * this.transform.x;
     this.mouseY = invertedScale * coords.y - invertedScale * this.transform.y;

      if(this.lassoKeyPressed) {
        this.interacting = true;
        this.lassoStart = {x: this.mouseX, y: this.mouseY} ;
        this.lassoPoints = [];
        this.lassoPoints.push(this.lassoStart);
        this.renderLasso(this.lassoPoints);

      }



      let node = this.getHoveringNode(this.mouseX, this.mouseY);
     console.log(node);
     console.log(this.mouseX, this.mouseY);
      if(node) {
        if(this.shiftKeyPressed) {
          this.selectCluster(node.cluster);
        } else {
          this.selectNode(node);
        }
        this.dragging = node;

      }
    }

  }

  zoompan(event) {
    if(!this.dragging && !this.interacting) {
      this.transform = event.transform;
    } else {
      let canvas = document.querySelector('#canvas');
      let coords = this.getMousePos(canvas, event.sourceEvent);
      let invertedScale = 1/ this.transform.k
      this.mouseX = invertedScale * coords.x - invertedScale * this.transform.x;
      this.mouseY = invertedScale * coords.y - invertedScale * this.transform.y;
      if (this.interacting) {
        this.lassoPoints.push({x: this.mouseX, y: this.mouseY});
        this.renderLasso( this.lassoPoints);

      }
    }
  }

  zoomend(event) {

    if(this.dragging || this.interacting) {
      event.transform.x = this.oldTransform.x;
      event.transform.y = this.oldTransform.y;
    } else {
      this.oldTransform.x = event.transform.x;
      this.oldTransform.y = event.transform.y;
    }
    this.dragging = null;

    if(this.interacting) {
      this.interacting = false;
      this.lassoPoints.push(this.lassoStart);
      this.lassoSelect();
      this.lassoPoints = [];
      event.transform.x = this.oldTransform.x;
      event.transform.y = this.oldTransform.y;
    }
  }






  hoverCluster(cluster) {
    this.unhover();
    this.logicalGraph.nodes2.forEach(node => {
      if(node.cluster === cluster) {
        node.visualNode.hovered = true;
        this.hoveredNodes.push(node.visualNode);
      }
    });
    this.clustersView.hoverCluster(cluster);
  }

  hoverNode(node) {

    this.unhover();

    if('rowNode' in node) {
      node.matrix.matrix.hover(node.rowNode, node.columnNode);
      this.clustersView.hoverCluster(node.rowNode.cluster);
      this.clustersView.hoverCluster(node.columnNode.cluster);
    } else {
      this.clustersView.hoverCluster(node.cluster);
    }

    node.hovered = true;
    this.hoveredNodes.push(node);
  }

  unhover() {
    this.hoveredNodes.forEach( node => {
      node.hovered = false;
      if('rowNode' in node) {
        node.matrix.matrix.unhover();
      }
    });
    this.hoveredNodes.splice(0, this.hoveredNodes.length);
    this.clustersView.unhoverAll();
  }

  lassoSelect() {
    let _this = this;
    this.logicalGraph.nodes2.forEach(function (node) {
      if (_this.lassoPoints.length <= 1){
        return;
      }

      let intersectionCount = 0;
      for (let i = 1; i < _this.lassoPoints.length; i++){

        let start = _this.lassoPoints[i-1];
        let end = _this.lassoPoints[i];
        let line = {start: start, end: end};

        let ray = {start: {x: node.visualNode.x, y: node.visualNode.y}, end: {x: 99999, y: 0}};
        let segment = {start: start, end: end};
        let rayDistance = {
          x: ray.end.x - ray.start.x,
          y: ray.end.y - ray.start.y
        };
        let segDistance = {
          x: segment.end.x - segment.start.x,
          y: segment.end.y - segment.start.y
        };

        let rayLength = Math.sqrt(Math.pow(rayDistance.x, 2) + Math.pow(rayDistance.y, 2));
        let segLength = Math.sqrt(Math.pow(segDistance.x, 2) + Math.pow(segDistance.y, 2));

        if ((rayDistance.x / rayLength === segDistance.x / segLength) &&
          (rayDistance.y / rayLength === segDistance.y / segLength)) {
          continue;
        }

        let T2 = (rayDistance.x * (segment.start.y - ray.start.y) + rayDistance.y * (ray.start.x - segment.start.x)) / (segDistance.x * rayDistance.y - segDistance.y * rayDistance.x);
        let T1 = (segment.start.x + segDistance.x * T2 - ray.start.x) / rayDistance.x;

        //Parametric check.
        if (T1 < 0) {
          continue;
        }
        if (T2 < 0 || T2 > 1) {
          continue;
        }
        if (isNaN(T1)) {
          continue;
        } //rayDistance.X = 0

        intersectionCount++;
      }
/*
      if (intercessionCount === 0) {
        seat.selected = false;
        return;
      }*/
      console.log(intersectionCount);
      if(intersectionCount & 1){
        console.log('Impar');
    //    seat.selected = true;
        _this.selectNode(node.visualNode);
      } else {
        console.log('Par');
      //  seat.selected = false;
      }


    });


  }

  selectCluster(cluster) {
    this.logicalGraph.nodes2.forEach(node => {
      if(node.cluster === cluster && !node.visualNode.selected) {
        node.visualNode.selected = true;
        this.selectedNodes.push(node.visualNode);
      }
    });
    this.hideOrShowSelectionTools();
  }

  selectNode(node) {

    if('rowNode' in node && node.rowNode === node.columnNode) {

      node = node.rowNode;
    }

    if(!node.selected) {
      node.selected = true;
      this.selectedNodes.push(node);
    } else {
      node.selected = false;
      this.selectedNodes.splice(this.selectedNodes.indexOf(node), 1);
    }
    this.hideOrShowSelectionTools();

  }

  unselect() {
    this.selectedNodes.forEach( node => {
      node.selected = false;
    });
    this.selectedNodes.splice(0, this.selectedNodes.length);
    this.hideOrShowSelectionTools();
    this.clustersView.unselectAll();
  }

  unselectCluster(cluster) {
    let nodesToRemove = [];
    this.selectedNodes.forEach( node => {
      if(node.cluster === cluster) {
        node.selected = false;
        nodesToRemove.push(node);
      }
    });
    while (nodesToRemove.length > 0) {
      let nodeToRemove = nodesToRemove.pop();
      this.selectedNodes.splice(this.selectedNodes.indexOf(nodeToRemove), 1);
    }
    this.hideOrShowSelectionTools();
  }

  hideOrShowSelectionTools() {
    if(this.selectedNodes.length === 0) {
      document.getElementById("selectiontools").style.top="-4rem";
    } else {
      document.getElementById("selectiontools").style.top="0.1rem";
    }
  }

  getHoveringNode(mouseX, mouseY) {
    let col = this.hiddenContext.getImageData(mouseX, mouseY, 1, 1).data;
    let colKey = 'rgb(' + col[0] + ',' + col[1] + ',' + col[2] + ')';

    let nodeData = this.data.colorToNode.get(colKey);
    if(nodeData && col[3] === 255) {
      return nodeData;
    }
    nodeData = this.colorToMatrixCell.get(colKey);
    if(nodeData && col[3] === 255) {
      let rowNode = nodeData.rowNode;
      let columnNode = nodeData.columnNode;
      let matrix = this.colorToMatrix.get(colKey);
      return {matrix: matrix, rowNode: rowNode, columnNode:columnNode};
    }

  }

  getMousePos(canvas, e) {
    let rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / (rect.right - rect.left) * canvas.width,
      y: (e.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height
    };
  }

  getTransformedPoint(x, y) {
    const transform = this.transform;
    const invertedScaleX = 1 / transform.k;
    const invertedScaleY = 1 / transform.k;

    const transformedX = x * invertedScaleX;
    const transformedY = y * invertedScaleY;

    return { x: transformedX, y: transformedY };
  }


  step() {
    let _this = this;
    this.context.clearRect(0, 0, this.w, this.h);

    this.context.save();
    this.context.translate(this.transform.x, this.transform.y);
    this.context.scale(this.transform.k, this.transform.k);

    this.hiddenContext.clearRect(0, 0, this.w, this.h);

    this.logicalGraph.links2.forEach( link => {
      if(link.visualLink.hidden) {
        return;
      }
      _this.context.beginPath();
      _this.drawLink(link);
      if(link.visualLink.sourceNode.selected || link.visualLink.targetNode.selected) {
        _this.context.strokeStyle = "rgba(220, 25, 25, 0.8)";
      } else if(link.visualLink.sourceNode.hovered || link.visualLink.targetNode.hovered) {
        _this.context.strokeStyle = "rgba(200, 200, 0, 0.8)";
      } else if(_this.hoveredNodes.length > 0 && !link.visualLink.sourceNode.hovered && !link.visualLink.targetNode.hovered) {
        _this.context.strokeStyle = 'rgba(100, 100, 100, 0.45)';
      } else if(_this.selectedNodes.length > 0 && !link.visualLink.sourceNode.selected && !link.visualLink.targetNode.selected) {
        _this.context.strokeStyle = 'rgba(0, 0, 0, 0.65)';
      } else {
        _this.context.strokeStyle = 'rgba(0, 0, 0, 0.9)';
      }
      _this.context.lineWidth = 1;
      _this.context.stroke();
    });
    this.context.restore();
    this.viewmatrix.forEach(matrix => {
      matrix.matrix.draw(_this.transform, matrix.x, matrix.y);
    });
    this.context.save();
    this.context.translate(this.transform.x, this.transform.y);
    this.context.scale(this.transform.k, this.transform.k);
    this.logicalGraph.nodes2.forEach(node => {
      if(node.visualNode.hidden) {
        return;
      }
     // let visualNode = _this.visualGraph.nodes.get(node.name);
      _this.context.beginPath();
      _this.drawNode(node.visualNode, _this.context)
      if(_this.clusters[node.cluster]) {

        if (node.visualNode.selected) {
          _this.context.fillStyle = _this.clusters[node.cluster].color;
        } else if(_this.hoveredNodes.length > 0 && !node.visualNode.hovered) {
          _this.context.fillStyle = hexToRgba(_this.clusters[node.cluster].color, 0.7);
        } else if(_this.selectedNodes.length > 0 && !node.visualNode.selected) {
          _this.context.fillStyle = hexToRgba(_this.clusters[node.cluster].color, 1);
        } else {
          _this.context.fillStyle = _this.clusters[node.cluster].color;
        }
      } else {
        //TODO more/unlimited clusters
        _this.context.fillStyle = '#fff';
      }

      if (node.visualNode.selected) {
        _this.context.strokeStyle = "rgba(220, 25, 25, 1)";
        _this.context.lineWidth = 2;
      } else if (node.visualNode.hovered) {
        _this.context.strokeStyle = "rgba(200, 200, 0, 1)";
        _this.context.lineWidth = 3;
      } else if(_this.hoveredNodes.length > 0 && !node.visualNode.hovered) {
        _this.context.strokeStyle = "rgba(0, 0, 0, 0.45)";
        _this.context.lineWidth = 1;
      } else if(_this.selectedNodes.length > 0 && !node.visualNode.selected) {
        _this.context.strokeStyle = "rgba(0, 0, 0, 0.65)";
        _this.context.lineWidth = 1;
      } else {
        _this.context.strokeStyle = '#000000'
        _this.context.lineWidth = 1;
      }


      _this.context.fill();
      _this.context.stroke();
    });

    this.logicalGraph.nodes2.forEach(node => {
      if(node.visualNode.hidden) {
        return;
      }
      _this.drawLabel(node.visualNode, _this.context)
    });

    this.context.restore();

    this.renderLasso(this.lassoPoints);



    if(_this.dragging) {
      _this.dragging.x = _this.mouseX;
      _this.dragging.y = _this.mouseY;
      _this.simulation.alpha(0.1).restart();
    }

    //this.viewmatrix.forEach(function (d) {
     // d.nodeSize = d.cluster.length * _this.cfg.matrix.cellSize;
      //d.width = d.nodeSize + _this.cfg.matrix.margin;
      //d.height = d.nodeSize + _this.cfg.matrix.margin;

   // });

    window.requestAnimationFrame(this.step.bind(this));
  }



  hiddenStep() {
    let _this = this;
    this.context.clearRect(0, 0, this.w, this.h);

    this.hiddenContext.save();
    this.hiddenContext.translate(this.transform.x, this.transform.y);
    this.hiddenContext.scale(this.transform.k, this.transform.k);
    this.logicalGraph.nodes2.forEach(node => {
      _this.hiddenContext.beginPath();
      _this.drawNode(node.visualNode, _this.hiddenContext)
      _this.hiddenContext.fillStyle = node.visualNode.hiddenColor;
      _this.hiddenContext.fill();

    });
    this.hiddenContext.restore();

    this.viewmatrix.forEach(matrix => {
      matrix.matrix.hiddenDraw(_this.transform, matrix.x, matrix.y);
    });
  }


  renderLasso(points) {

    if (points.length <= 1){
      return;
    }

    this.context.save();
    this.context.translate(this.transform.x, this.transform.y);
    this.context.scale(this.transform.k, this.transform.k);

    this.context.setLineDash([5,3]);
    this.context.strokeStyle = 'black';
    this.context.fillStyle = 'rgba(0,0,0,0.2)';
    this.context.lineWidth = 1;
    this.context.beginPath();
    for (let index = 0; index < points.length; index ++){
      let point = points[index];
      if (index === 0){
        this.context.moveTo(point.x, point.y);
      } else
      {
        this.context.lineTo(point.x, point.y);
      }
    }

    this.context.lineTo(this.lassoStart.x, this.lassoStart.y);
    this.context.fill();
    this.context.stroke();
    this.context.closePath();
    this.context.restore();
  }

  drawLink(d) {
    let _this = this;

    let sourceCoords = this.calculateCircling(_this.logicalGraph.nodes2.get(d.source).visualNode);
    let targetCoords = this.calculateCircling(_this.logicalGraph.nodes2.get(d.target).visualNode);

    this.context.moveTo(targetCoords.x, targetCoords.y);
    this.context.lineTo(sourceCoords.x, sourceCoords.y);
  }

  drawNode(d, context) {

    let coords = this.calculateCircling(d);
    let nodeX = coords.x;
    let nodeY = coords.y;

    context.moveTo(nodeX + d.radius, nodeY);
    context.arc(nodeX, nodeY, d.radius, 0, 2 * Math.PI);
  //  context.attr('fillStyleHidden', d.hiddenColor);

  }

  drawLabel(d, context) {
    context.font = d.radius + "px Arial";

    if (d.selected) {
      context.fillStyle = "rgba(220, 25, 25, 1)";
    } else if (d.hovered) {
      context.fillStyle = "rgba(200, 200, 0, 1)";
    } else if(this.hoveredNodes.length > 0 && !d.hovered) {
      context.fillStyle = "rgba(0, 0, 0, 0.45)";
    } else if(this.selectedNodes.length > 0 && !d.selected) {
      context.fillStyle = "rgba(0, 0, 0, 0.65)";
    } else {
      context.fillStyle = '#000000'
    }

    context.textBaseline = 'middle';
    context.shadowColor = "#eee"
    context.shadowBlur = 5;
    context.fillText(d.name, d.x + d.radius + 5, d.y + 2);
  }

  calculateCircling(d) {
    let nodeX = d.x;
    let nodeY = d.y;
    if(d.isNew && this.highlightNew) {
      nodeX = d.x + Math.cos(this.circlingAngle) * this.circlingRadius;
      nodeY = d.y + Math.sin(this.circlingAngle) * this.circlingRadius;
    } else if(d.willGo && this.highlightLeaving) {
      nodeX = d.x + Math.cos(-1 * this.circlingAngle) * this.circlingRadius;
      nodeY = d.y + Math.sin(-1 * this.circlingAngle) * this.circlingRadius;
    }
    return {x: nodeX, y:nodeY};
  }

  setTimeSlice(newTimeSlice) {

    let _this = this;
    let matrices = [];
    let matrixCoords = [];



    for (let i = 0; i < this.viewmatrix.length; i++) {
      //matrices.push(this.viewmatrix[i].cluster);
     // matrixCoords.push({x: this.viewmatrix[i].xPos, y: this.viewmatrix[i].yPos})
    }
/*
    for (let i = this.viewmatrix.length - 1; i >= 0; i--) {
      this.delete(this.viewmatrix[i]);
    }
*/
    this.data.timeslices[newTimeSlice].nodes2.forEach(function (node) {
      if(!_this.logicalGraph.nodes2.has(node.id)) {
        node.visualNode.isNew = true;
      } else {
        node.visualNode.isNew = false;
      }

      if(_this.data.timeslices[newTimeSlice + 1] && !_this.data.timeslices[newTimeSlice + 1].nodes2.has(node.id)) {
        node.visualNode.willGo = true;
      } else {
        node.visualNode.willGo = false;
      }
    });

    this.logicalGraph = this.data.timeslices[newTimeSlice];
/*
    this.visualGraph.nodes.forEach(function (n) {
      n.invisible = !getNodeById(_this.logicalGraph.nodes, n.id);
    });
*/
/*
    this.visualGraph.links.forEach(function (link, i) {
      link.sourceNode = getNodeById(_this.visualGraph.nodes, link.source);
      link.targetNode = getNodeById(_this.visualGraph.nodes, link.target);
      link.invisible = !(getNodeById(_this.logicalGraph.nodes, link.sourceNode.id)
        && getNodeById(_this.logicalGraph.nodes, link.targetNode.id));
    });
*/


    this.visualGraph.links.forEach(function (link, i) {
      if(!_this.logicalGraph.links2.has(link.source + "-" + link.target)) {
        link.invisible = true;
      } else {
        link.invisible = false;
      }
    });

    this.viewbridges.forEach(function (bridge, i) {
      if(!_this.logicalGraph.links2.has(bridge.source + "-" + bridge.target)) {
        bridge.invisible = true;
      } else {
        bridge.invisible = false;
      }
    });

    this.update(0.1);

    this.updateClustering(this.clusteringView.getClustering());

/*
    while (matrices.length > 0) {
      let matrix = matrices.pop();
      let pos = matrixCoords.pop();
      let invalidNodes = getInvalidNodes(_this.logicalGraph, matrix);

      this.createMatrix(matrix, invalidNodes, pos.x, pos.y);
    }
*/

    for (let i = 0; i < this.viewmatrix.length; i++) {
      this.viewmatrix[i].setTimeSlice();
    }

  }

  update(alpha = 1) {

    let _this = this;

    this.updateMatrices(this.viewmatrix);

    this.visualGraph.nodes.forEach(function (n) {
      if ('subgraph' in n) {
        n.charge = _this.cfg.matrix.charge * n.matrix.submatrix.length * n.matrix.submatrix.length;
        let halfWidth = (n.matrix.submatrix.length / 2 + 1) * _this.cfg.matrix.cellSize * _this.cfg.matrix.radiusFactor
        n.radius = Math.sqrt(halfWidth * halfWidth + halfWidth * halfWidth)
        //n.radius = n.matrix.submatrix.length * Math.sqrt(2) / 2 * _this.cfg.matrix.cellSize + _this.cfg.matrix.cellSize * _this.cfg.matrix.radiusFactor;
        n.subgraph.nodes.forEach(function (n2, i) {
          n2.charge = 0;
        });

        if (n.xPos) n.x = n.xPos;
        if (n.yPos) n.y = n.yPos;


      } else {
        n.charge = _this.cfg.node.charge;
        //n.radius = _this.cfg.node.radius;
        _this.calculateRadius(n);
        if (n.invisible) {
          n.charge = _this.cfg.node.charge * 0.12;
          n.radius = 0;
        }
      }

    });


    this.viewmatrix.forEach(function (matrix) {
      matrix.nodeSize = matrix.cluster.length * _this.cfg.matrix.cellSize;
      matrix.height = matrix.nodeSize + _this.cfg.matrix.margin;
    });

/*
    this.visualGraph.links.forEach(function (n, i) {
      n.invisible = !getLinkById(_this.logicalGraph.links, n.id);
      if (n.invisible) {
        n.value = 0.85;
      }
    });
*/
    this.updateNodes(this.visualGraph.nodes);
    this.updateLinks(this.visualGraph.links);

    this.simulation.alpha(alpha).restart();


    console.log(this.viewbridges)
  }

  updateOrdering(ordering) {
    let _this = this;
    this.viewmatrix.forEach(function (d, i) {
      d.matrix.setOrdering(ordering, _this.data);
    });


    this.update(0);
  }

  updateClustering(clustering) {

    this.clusteringController.changeClustering(this.logicalGraph, clustering);


    this.clustersView.update(this.logicalGraph, this.clusteringController.getCurrentClusters(this.logicalGraph, clustering), this.logicalGraph.nodes2, this.clusters);
    this.updateNodes(this.visualGraph.nodes);
   /* this.viewmatrix.forEach(function (nodetrix) {
      nodetrix.matrix.update(false);
    });*/


  }

  updateMatrices(matrices) {
    let _this = this

    this.viewmatrix.forEach(function (matrix) {
      matrix.matrix.update(false, _this.transform);
    });

/*
    this.matrix = this.matrix
      .data(matrices, d => d.id)
      .join(
        enter => enter.append("g")
          .attr("class", "matrix")
          .each(function (nodetrix) {
            let matrix = new Matrix(d3.select(this), _this.cfg);
            let submatrix = nodetrix.getSubmatrix();
            matrix.setup(submatrix, [], _this.reorderingView.getReordering(), _this.clusters, _this.reorderingController);
            nodetrix.matrix = matrix;
          })
      );
    this.matrix.transition().style("opacity", 1);
    this.matrix.exit().remove();

    this.viewmatrix.forEach(function (nodetrix) {
      nodetrix.matrix.update(false);
    });
    */

  }

  updateNodes(nodes) {

    let _this = this;


/*
    const old = new Map(this.node.data().map(d => [d.id, d]));
    nodes = nodes.map(d => Object.assign(old.get(d.id) || {}, d));

    this.node = this.node
      .data(nodes, d => d.id)
      .join(
        enter => enter.append(function (d) {
          return document.createElementNS("http://www.w3.org/2000/svg", ("subgraph" in d) ? "rect" : "circle");
        })
          .style("opacity", 0)
          .attr("fill", function (d) {
            if ("subgraph" in d) {
              return "#000";
            }
            return _this.clusters[d.cluster].color
          }),
        update => update
          .attr("fill", function (d) {
            if ("subgraph" in d) {
              return "#000";
            }
            return _this.clusters[d.cluster].color
          }),
        exit => exit
          .call(exit => exit.remove())
      )
      .attr("class", "node");

    this.text = this.text
      .data(nodes, d => d.id)
      .join(
        enter => enter.append("text"),
        update => update,
        exit => exit
          .call(exit => exit.remove())
      )
      .attr("class", "label")
      .attr("x", "1em")
      .attr("y", ".30em")
      .text(d => d.name);

*/
 //   this.matrixDragHandler.setNodes(this.svg.selectAll('.matrix'));
  //  this.dragHandler.setNodes(this.node);
    this.simulation.nodes(nodes);


  }

  updateLinks(links) {

    let _this = this;
    links = links.map(d => Object.assign({}, d));

    links.forEach(function (link) {
      link.strength = _this.cfg.link.strength;
      link.distance = _this.cfg.link.distance;
    });

    /*

    // since bridges are just visual, for every bridge we add one invisible link to the graph
    this.viewbridges.forEach(function (bridge) {
      if (bridge.originalSource && bridge.originalTarget) {
        return;
      }
      let newLink = {
        id: 1000000 + idFactory.get("invLink"),
        source: (bridge.originalSource ? bridge.sourceNode.id : bridge.targetNode.id),
        target: (bridge.originalSource ? bridge.target : bridge.source),
        strength: _this.cfg.link.bridgeStrength,
        distance: 200,
        invisible: true,
        value: 0.85
      };
      newLink.distance =  (bridge.originalSource ? bridge.sourceNode.radius : bridge.targetNode.radius) + _this.cfg.matrix.margin;
      links.push(newLink);
    });

    this.link = this.link
      .data(links, d => (d.source.id + "-" + d.target.id))
      .join(enter => enter.append("line"),
        update => update,
        exit => exit
          .call(exit => exit.remove())
      );

    this.bridge = this.bridge
      .data(this.viewbridges, d => d.id)
      .join(
        enter => enter.append("svg:path")
          .attr("class", "bridge"),
        update => update,
        exit => exit
          .call(exit => exit.remove())
      );*/

    this.simulation.force("link").links(links).strength(l => l.value);
  }

  copyNodeProperties(d) {
    const node = getNodeById(this.visualGraph.nodes, d.id);
    if (node) {
      node.xPos = d.x;
      node.yPos = d.y;
      d.highlighted = node.highlighted;
      d.invisible = node.invisible;
      d.radius = node.radius;
      d.charge = node.charge;
    }


  }

  ticked() {
    /*
    let _this = this;

    this.node.each(d => this.copyNodeProperties(d));

    this.node.attr("cx", d => d.x)
      .attr("cy", d => d.y)
      .attr("r", d => d.radius)
      .style("stroke", function (d) {
        if (d.highlighted) {
          return _this.cfg.node.strokeHighlighted;
        }
        return _this.cfg.node.stroke;
      })
      .style("visibility", function (d) {
        if (d.invisible) {
          return "hidden";
        }
      })
      .style("stroke-width", _this.cfg.node.strokeWidth);


    this.text.attr("dx", d => d.x)
      .attr("dy", d => d.y)
      .style("visibility", function (d) {
        if (d.invisible) {
          return "hidden";
        }
      })

    this.link.attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y)
      .style("stroke", _this.cfg.link.stroke)
      .style("stroke-width", function (d) {
        if (d.invisible) {
          return 0;
        }
        return _this.cfg.link.strokeWidth;
      });

    this.viewmatrix.forEach(function (d) {
      d.nodeSize = d.cluster.length * _this.cfg.matrix.cellSize;
      d.width = d.nodeSize + _this.cfg.matrix.margin;
      d.height = d.nodeSize + _this.cfg.matrix.margin;
      d.matrix.render();
    });

    let matAttr = [];

    this.matrix.attr("transform", function (d) {
      let pos = !isNaN(d.xPos) && !isNaN(d.yPos) ? "translate(" + (d.xPos - d.nodeSize / 2.0) + "," + (d.yPos - d.nodeSize / 2.0) + ")" : "translate(0,0)"
      matAttr[d.id] = {
        pos: pos,
        width: _this.cfg.matrix.cellStrokeWidth + _this.cfg.matrix.cellSize * d.matrix.submatrix.length,
        height: _this.cfg.matrix.cellStrokeWidth + _this.cfg.matrix.cellSize * d.matrix.submatrix.length
      };
      return pos;
    });

    this.node.attr("transform", function (d) {
      if (!("subgraph" in d)) {
        return "translate(0,0)";
      }
      return matAttr[d.id].pos;
    }).attr("width", function (d) {
      if (!("subgraph" in d)) {
        return "0";
      }
      return matAttr[d.id].width;
    }).attr("height", function (d) {
      if (!("subgraph" in d)) {
        return "0";
      }
      return matAttr[d.id].height;
    }).style("stroke-width", function (d) {
      if (!("subgraph" in d)) {
        return _this.cfg.node.strokeWidth;
      }
      return 0;
    }).style("opacity", function (d) {
      if (!("subgraph" in d)) {
        return 1;
      }
      return 0;
    });

*/

  }


  createMatrix(cluster, invalidNodes, x, y) {

    let _this = this;

    if (cluster.length <= 1) {
      return null;
    }

    let loc = this.computeMatrixLocation(x, y, cluster);

    let nodeMatrix = {
      links: [],
      id: 1000000 + idFactory.get("nodeMatrix"), //self.logicalGraph.nodes.length + this.IDFactory.get(),// >> node id should be unique during the whole program because we use the same viewmatrix array to create svg nodes
      sticky: false, fixed: false, // indicates if the node is fixed in the force layout
      x: loc.x, y: loc.y, // position in the force layout
      cluster: cluster,
      nodeSize: cluster.length * 20,
      width: cluster.length * 20 + 10,
      height: cluster.length * 20 + 10, // size of the box to avoid overlap in d3cola and visual size
      weight: 1,
      subgraph: {nodes: new Map(), links: new Map()},
      matrix: new Matrix(d3.select(_this), _this.cfg),
      getSubmatrix: function () {
        let data = [];
        let obj = this;
        let nm = this;


        let iIndex = 0;
        let jIndex = 0;

        obj.subgraph.nodes.forEach(function (d) {
          data[iIndex] = [];
          obj.subgraph.nodes.forEach(function (d2) {


            let hiddenColor = colorFactory.genColor();
            _this.colorToMatrixCell.set(hiddenColor, {rowNode: d, columnNode: d2});
            _this.colorToMatrix.set(hiddenColor, obj);
            data[iIndex][jIndex] = {x: iIndex, y: jIndex, z: 0, parent: obj, hiddenColor: hiddenColor, n1: d, n2: d2};
            jIndex++;
          });
          data[iIndex][iIndex].z = 1;
          data[iIndex][iIndex].node = d;
          jIndex = 0;
          iIndex++;
        });




        /*
        this.subgraph.nodes.forEach(function (d, i) {
          data[i] = d3.range(obj.subgraph.nodes.length).map(function (j) {
            let hiddenColor = colorFactory.genColor();
            _this.colorToMatrixCell.set(hiddenColor, {rowNode: d, columnNode: nm.subgraph.nodes[j]});
            _this.colorToMatrix.set (hiddenColor, nm);
            return {x: j, y: i, z: 0, parent: obj, hiddenColor: hiddenColor};
          });
          data[i][i].z = 1;
          data[i][i].node = d;
        });*/

        this.subgraph.links.forEach(function (link) {

          let source = link.sourceNode.id;
          let target = link.targetNode.id;
          if (source < 0 || target < 0) throw "Linking error: from " + source + " to " + target;

          let matrixNodes = getMatrixNodeById(data, source, target);

          matrixNodes.n1.z += link.value;
          matrixNodes.n2.z += link.value;

          //data[source][target].z += link.value;
          //data[target][source].z += link.value;
        });
        return data;
      },
      setTimeSlice() {
        let leavingNodes = [];

        this.cluster.forEach(function (nodeId) {
          if(!_this.logicalGraph.nodes2.has(nodeId)) {
            leavingNodes.push(nodeId);
          }
        });

/*

        while (leavingNodes.length > 0) {
          let leavingNode = leavingNodes.pop();
          this.cluster.splice(this.cluster.indexOf(leavingNode), 1);
        }

        this.subgraph.nodes = [];
        this.subgraph.links = [];
        for (let i = 0; i < cluster.length; i++) {
          let node = _this.logicalGraph.nodes2.get(cluster[i]).visualNode;
          this.subgraph.nodes.push(node);


          for (let j = 0; j < node.links.length; j++) {
            let edge = getLinkById(_this.visualGraph.links, node.links[j].id);
            if (!edge) {
              edge = getLinkById(_this.viewbridges, node.links[j].id);
            }
          }
        }



 */
        this.matrix.setTimeslice(leavingNodes);

        this.nodeSize = cluster.length * 20;
        this.width = cluster.length * 20 + 10;
        this.height = cluster.length * 20 + 10;
      }
    };
    this.viewmatrix.push(nodeMatrix);
    this.visualGraph.nodes.push(nodeMatrix);

    let nodesToRemove = [];
    let edgesToRemove = [];

    let invisivleNodesId = 0;

    for (let i = 0; i < cluster.length; i++) {
      let node;
      if(this.logicalGraph.nodes2.has(cluster[i])) {
        node = this.logicalGraph.nodes2.get(cluster[i]).visualNode;
      } else {
        node = {id: invisivleNodesId++, name: "test", hiddenColor: null, links:[], greyed: true}
      }

      if(!node.greyed) {
        nodesToRemove.push(node);
      }

      nodeMatrix.subgraph.nodes.set(node.id, node);
      this.index[node.id] = nodeMatrix;


      console.log(node.links);

      for (let j = 0; j < node.links.length; j++) {

        let edge = getLinkById(this.visualGraph.links, node.links[j].id);


        if (!edge) {
          edge = getLinkById(this.viewbridges, node.links[j].id);
        }


        if (!cluster.includes(edge.sourceNode.id) && !cluster.includes(edge.targetNode.id)) {
          throw "Linking crash";
        } else if (cluster.includes(edge.sourceNode.id) && cluster.includes(edge.targetNode.id)) {
          if (!edgesToRemove.includes(edge)) {
            edgesToRemove.push(edge);
            nodeMatrix.subgraph.links.set(edge.id, edge);
          }
        } else {
          if (cluster.includes(edge.sourceNode.id) && !cluster.includes(edge.targetNode.id)) {
            edge.originalSource = edge.sourceNode;
            edge.sourceNode = nodeMatrix;
          }
          if (cluster.includes(edge.targetNode.id) && !cluster.includes(edge.sourceNode.id)) {
            edge.originalTarget = edge.targetNode;
            edge.targetNode = nodeMatrix;
          }
/*
          // only actually draw bridge if both nodes are present in this time slice and the edge was not invisible in the first place
          edge.invisible = !(('subgraph' in edge.sourceNode || getNodeById(this.logicalGraph.nodes, edge.sourceNode.id))
            && ('subgraph' in edge.targetNode || getNodeById(this.logicalGraph.nodes, edge.targetNode.id)))
            || edge.invisible;*/

          if (this.visualGraph.links.includes(edge)) {
            edgesToRemove.push(edge);
          }

          if (!this.viewbridges.includes(edge)) {
            this.viewbridges.push(edge);
          }

          nodeMatrix.links.push(edge);
        }
      }
    }


    while (edgesToRemove.length > 0) {
      let edgeToRemove = edgesToRemove.pop();
      this.visualGraph.links[this.visualGraph.links.indexOf(edgeToRemove)].hidden = true;
      this.visualGraph.links.splice(this.visualGraph.links.indexOf(edgeToRemove), 1);
    }

    while (nodesToRemove.length > 0) {
      let nodeToRemove = nodesToRemove.pop();
      this.visualGraph.nodes[this.visualGraph.nodes.indexOf(nodeToRemove)].hidden = true;
      this.visualGraph.nodes.splice(this.visualGraph.nodes.indexOf(nodeToRemove), 1);
    }

    let submatrix = nodeMatrix.getSubmatrix();


    nodeMatrix.matrix.setup(submatrix, nodeMatrix.links, null, _this.reorderingView.getReordering(), _this.clusters, _this.reorderingController, _this.context, _this.hiddenContext, _this.transform);

    this.update(0.05);

    this.unselect();

    return nodeMatrix;


  }

  computeMatrixLocation(x, y, cluster) {
    let clusterSize = 0;
    let reverseCreation = false
    let computeLocation = x === undefined || y === undefined;
    if (computeLocation) {
      x = 0;
      y = 0;
    }

    for (let k = 0; k < cluster.length; k++) {
      let node;
      if(this.logicalGraph.nodes2.has(cluster[k])) {
        node = this.logicalGraph.nodes2.get(cluster[k]).visualNode;
        clusterSize++;
      } else {
        continue;
      }

      if (computeLocation) {
        x += node.x;
        y += node.y;
      }
      if (node.id in this.index) {
        let oldNodeMatrix = this.index[node.id];
        let flag = true;
        for (let l = 0; l < oldNodeMatrix.subgraph.nodes.length; l++) {
          if (cluster.includes(oldNodeMatrix.subgraph.nodes[l].id)) {
            flag = false;
          }
        }

        this.delete(oldNodeMatrix);
        if (flag && cluster.length === oldNodeMatrix.subgraph.nodes.length) {
          reverseCreation = true;
          break;
        }
      }
    }
    if (reverseCreation) return null;
    if (computeLocation) {
      x /= clusterSize;
      y /= clusterSize;
    }

    return {x: x, y: y};
  }

  deleteAllWithNodes(nodes) {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = 0; j < this.viewmatrix.length; j++) {

        if (getNodeById(this.viewmatrix[j].subgraph.nodes, nodes[i])) {
          this.delete(this.viewmatrix[j]);
        }
      }
    }
  }

  deleteAll() {
    while (this.viewmatrix.length > 0) {
      this.delete(this.viewmatrix[this.viewmatrix.length - 1]);
    }
  }

  delete(nodeMatrix) {
    let _this = this;

    this.visualGraph.nodes.splice(this.visualGraph.nodes.indexOf(nodeMatrix), 1);
    this.viewmatrix.splice(this.viewmatrix.indexOf(nodeMatrix), 1);

    nodeMatrix.subgraph.nodes.forEach(function (d, i) {
      d.hidden = false;
      _this.visualGraph.nodes.push(d);
      delete _this.index[d.id];
    });
    nodeMatrix.subgraph.links.forEach(function (d) {
      d.hidden = false;
      _this.visualGraph.links.push(d);
    });
    nodeMatrix.links.forEach(function (edge) {
      if (edge.sourceNode === nodeMatrix) {
        edge.sourceNode = edge.originalSource;
        delete edge.originalSource;
        if (!('subgraph' in edge.targetNode)) {
          _this.viewbridges.splice(_this.viewbridges.indexOf(edge), 1);
          edge.hidden = false;
          _this.visualGraph.links.push(edge);
        }
      }
      if (edge.targetNode === nodeMatrix) {
        edge.targetNode = edge.originalTarget;
        delete edge.originalTarget;
        if (!('subgraph' in edge.sourceNode)) {
          _this.viewbridges.splice(_this.viewbridges.indexOf(edge), 1);
          edge.hidden = false;
          _this.visualGraph.links.push(edge);
        }
      }
    });

    this.update(1);
  }

  destroy() {
    this.simulation.stop();
  }

}
