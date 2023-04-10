class ClustersView {
  graph = null;
  data = null;
  allClusters = [];
  currentClusters = [];
  selectedClusters = [];
  currentNodes = [];

  constructor() {
  }

  setGraph(graph) {
    this.graph = graph;
  }

  update(data, currentClusters, currentNodes, allClusters) {
    let _this = this;

    this.currentClusters = currentClusters;
    this.allClusters = allClusters;

    this.currentNodes = currentNodes;

    const clusterView = document.getElementById("clusterslist");
    clusterView.innerHTML = '';
    const nodesView = document.getElementById("nodeslist");
    nodesView.innerHTML = '';

    document.getElementById("deleteButton").onclick = function () {
      _this.graph.deleteAll();
    };

    //sort clusters by id
    currentClusters.sort(function(a, b) {
      if (a.id < b.id) return -1;
      if (a.id > b.id) return 1;
      return 0;
    });

    currentClusters.forEach(function(cluster) {
      let btnContainer = document.createElement("div");
      btnContainer.id = "clustersView-cluster-" + cluster.id;
      btnContainer.classList.add("colorscale-item");
      btnContainer.style.backgroundColor = _this.allClusters[cluster.id].color;

      btnContainer.addEventListener("mouseover", function( event ) {
        _this.hoverCluster(cluster.id);
        _this.graph.hoverCluster(cluster.id);
      }, false);
      btnContainer.addEventListener("mouseout", function( event ) {
        _this.unhoverCluster(cluster.id);
        _this.graph.unhover();
      }, false);

      btnContainer.addEventListener("click", function( event ) {
        if(!_this.isClusterSelected(cluster.id)) {
          _this.selectCluster(cluster.id);
          _this.graph.selectCluster(cluster.id);
        } else {
          _this.unSelectCluster(cluster.id);
          _this.graph.unselectCluster(cluster.id);
        }
      }, false);


      let btnLabel = document.createElement("span");
      /*
      let createBtn = document.createElement("button");
      createBtn.innerHTML = 'Create';
      createBtn.onclick = function () {
        _this.graph.deleteAllWithNodes(_this.getGroupNodes(data, cluster.id));
        _this.graph.createMatrix(_this.getGroupNodes(data, cluster.id));
      }
      btnContainer.appendChild(createBtn);
*/
      /*
      let deleteBtn = document.createElement("button");
      deleteBtn.innerHTML = 'Delete';
      deleteBtn.onclick = function () {
        _this.graph.deleteAllWithNodes(_this.getGroupNodes(data, cluster.id));
      }
      btnContainer.appendChild(deleteBtn);
*/
      btnLabel.innerHTML = cluster.name + '';
      btnContainer.appendChild(btnLabel);


      clusterView.appendChild(btnContainer);
    });

    currentNodes.forEach(function(node) {
      let btnContainer = document.createElement("div");
      btnContainer.id = "clustersView-node-" + node.id;
      btnContainer.classList.add("colorscale-item");
      btnContainer.style.backgroundColor = _this.allClusters[node.cluster].color;

      btnContainer.addEventListener("mouseover", function( event ) {
        //_this.hoverCluster(cluster.id);
        _this.graph.hoverNode(node.id);
      }, false);
      btnContainer.addEventListener("mouseout", function( event ) {
       // _this.unhoverCluster(cluster.id);
        _this.graph.unhover();
      }, false);
/*
      btnContainer.addEventListener("click", function( event ) {
        if(!_this.isClusterSelected(cluster.id)) {
          _this.selectCluster(cluster.id);
          _this.graph.selectCluster(cluster.id);
        } else {
          _this.unSelectCluster(cluster.id);
          _this.graph.unselectCluster(cluster.id);
        }
      }, false);

*/
      let btnLabel = document.createElement("span");

      btnLabel.innerHTML = node.name + '';
      btnContainer.appendChild(btnLabel);


      nodesView.appendChild(btnContainer);
    });

  }

  hoverCluster(cluster) {
    if(!this.isClusterSelected(cluster)) {
      document.getElementById("clustersView-cluster-" + cluster).style.backgroundColor = pSBC(0.3, this.allClusters[cluster].color);
    }
  }

  unhoverCluster(cluster) {
    if(!this.isClusterSelected(cluster)) {
      document.getElementById("clustersView-cluster-" + cluster).style.backgroundColor = this.allClusters[cluster].color;
    }
  }

  selectCluster(cluster) {
    document.getElementById("clustersView-cluster-" + cluster).style.backgroundColor = pSBC(0.45, this.allClusters[cluster].color);
    document.getElementById("clustersView-cluster-" + cluster).style.border = "solid 1px #000";
    this.selectedClusters.push(cluster);
  }

  unSelectCluster(cluster) {
    console.log(cluster)
    document.getElementById("clustersView-cluster-" + cluster).style.backgroundColor = this.allClusters[cluster].color;
    document.getElementById("clustersView-cluster-" + cluster).style.border = "solid 1px " + this.allClusters[cluster].color;
    this.selectedClusters.splice(this.selectedClusters.indexOf(cluster), 1);
  }

  isClusterSelected(cluster) {
    return this.selectedClusters.includes(cluster);
  }


  unhoverAll() {
    let _this = this;
    this.currentClusters.forEach(function(cluster) {
      if(!_this.isClusterSelected(cluster.id)) {
        document.getElementById("clustersView-cluster-" + cluster.id).style.backgroundColor = _this.allClusters[cluster.id].color;
      }
    });
  }

  unselectAll() {
    let _this = this;
    this.currentClusters.forEach(function(cluster) {
      if(_this.isClusterSelected(cluster.id)) {
        _this.unSelectCluster(cluster.id);
      }
    });
  }


  lightenDarkenColor(col, amt) {
    console.log(col)
    col = parseInt(col, 16);
    return (((col & 0x0000FF) + amt) | ((((col >> 8) & 0x00FF) + amt) << 8) | (((col >> 16) + amt) << 16)).toString(16);
  }

  getGroupNodes(group, n) {
    let nodes = [];
    group.nodes2.forEach(function (node) {
      if (node.cluster === n) {
        nodes.push(node.id);
      }
    });
    return nodes;
  }

}
