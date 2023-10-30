cc = "";
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
    let _this = this;
    this.graph = graph;

    document.getElementById("deleteButton").onclick = function () {
      _this.graph.deleteAll();
    };

    document.getElementById("filterText").addEventListener("input", this.filterNodes.bind(_this));
  }

  update(data, currentClusters, currentNodes, allClusters, currentClustering) {
    let _this = this;

    this.currentClusters = currentClusters;
    this.allClusters = allClusters;

    this.currentNodes = currentNodes;
    cc = currentClustering;

    const clusterView = document.getElementById("clusterslist");
    clusterView.innerHTML = '';
    const nodesView = document.getElementById("nodeslist");
    nodesView.innerHTML = '';

    //sort clusters by id
    currentClusters.sort(function(a, b) {
      if (a.id < b.id) return -1;
      if (a.id > b.id) return 1;
      return 0;
    });

    const filteredClusters = currentClusters.filter(this.filterClusters);

    const nodeList = Array.from( currentNodes.values() );
    const filteredNodes = nodeList.filter(this.filterText);


    filteredClusters.forEach(function(cluster) {
      let btnWrapper = document.createElement("div");
      let btnContainer = document.createElement("div");

      btnContainer.id = "clustersView-cluster-" + cluster.id;
      btnContainer.classList.add("colorscale-item");
      btnWrapper.style.backgroundColor = _this.allClusters[cluster.id].color;

      btnContainer.addEventListener("mouseover", function( event ) {
        _this.hoverCluster(cluster.id);
        _this.graph.hoverCluster(cluster.id);

        _this.currentNodes.forEach(node => {
          if(node.cluster === cluster.id) {
            _this.hoverNode(node);
          }
        });
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

        _this.graph.unhover();
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

      if(cluster.group !== "none" && cc === "Labels") {
        btnLabel.innerHTML = cluster.group + '';
      } else {
        btnLabel.innerHTML = cluster.name + '';
      }


      btnContainer.appendChild(btnLabel);


      btnWrapper.classList.add("colorscale-wrapper");

      btnWrapper.appendChild(btnContainer);
      clusterView.appendChild(btnWrapper);
    });

    filteredNodes.forEach(function(node) {
      let btnWrapper = document.createElement("div");
      let gotoButton = document.createElement("button");
      let btnContainer = document.createElement("div");


      btnContainer.id = "clustersView-node-" + node.id;
      btnContainer.classList.add("colorscale-item");
      btnContainer.style.backgroundColor = _this.allClusters[node.cluster].color;

      btnContainer.addEventListener("mouseover", function( event ) {
        _this.hoverNode(node);
        _this.graph.hoverNode(node.visualNode);
      }, false);
      btnContainer.addEventListener("mouseout", function( event ) {
       // _this.unhoverCluster(cluster.id);
        _this.unhoverNode(node);
        _this.graph.unhover();
      }, false);

      btnContainer.addEventListener("click", function( event ) {


          _this.selectNode(node);
          _this.graph.selectNode(node.visualNode);



      }, false);


      gotoButton.addEventListener("click", function( event ) {

        _this.graph.gotoNode(node);


      }, false);

      let btnLabel = document.createElement("span");

      btnLabel.innerHTML = node.name + '';
      btnContainer.appendChild(btnLabel);


      gotoButton.innerHTML = '◎';
      btnWrapper.classList.add("colorscale-wrapper");
      btnWrapper.appendChild(gotoButton);
      btnWrapper.appendChild(btnContainer);

      nodesView.appendChild(btnWrapper);
    });

  }

  filterText(text) {
    return (text.name + "").toLowerCase().includes(document.getElementById("filterText").value.toLowerCase());
  }

  filterNodes() {
    this.update(null, this.currentClusters, this.currentNodes, this.allClusters, cc)
  }

  filterClusters(c) {
    let filter = document.getElementById("filterText").value.toLowerCase();

    let property = "";
    if(c.group && c.group !== "none" && cc === "Labels") {
      property = c.group;
    } else if(c.name) {
      property = c.name;
    }

    console.log(c)

    return property.toLowerCase().includes(filter);
  }

  hoverCluster(cluster) {
    if(!this.isClusterSelected(cluster)) {
      //document.getElementById("clustersView-cluster-" + cluster).style.backgroundColor = pSBC(0.3, this.allClusters[cluster].color);
      if( document.getElementById("clustersView-cluster-" + cluster)) {
        document.getElementById("clustersView-cluster-" + cluster).style.border = "solid 3px "+ this.graph.cfg.general.hoverColor;
      }
    }
  }

  hoverNode(node) {
    if(!this.isNodeSelected(node)) {
      //document.getElementById("clustersView-node-" + node.id).style.backgroundColor = pSBC(0.3, this.allClusters[node.cluster].color);
      if(document.getElementById("clustersView-node-" + node.id)) {
        document.getElementById("clustersView-node-" + node.id).style.border = "solid 3px "+ this.graph.cfg.general.hoverColor;
      }
    }
  }

  unhoverCluster(cluster) {
    if(document.getElementById("clustersView-cluster-" + cluster)) {
      if(!this.isClusterSelected(cluster)) {
        //document.getElementById("clustersView-cluster-" + cluster).style.backgroundColor = this.allClusters[cluster].color;
        document.getElementById("clustersView-cluster-" + cluster).style.border = "solid 3px #fff";
      } else {
        document.getElementById("clustersView-cluster-" + cluster).style.border = "solid 3px "+ this.graph.cfg.general.selectionColor;
      }
    }
  }

  unhoverNode(node) {
    if(document.getElementById("clustersView-node-" + node.id)) {
      if(!this.isNodeSelected(node)) {
        // document.getElementById("clustersView-node-" + node.id).style.backgroundColor = this.allClusters[node.cluster].color;
        document.getElementById("clustersView-node-" + node.id).style.border = "solid 3px #fff";
      } else {
        document.getElementById("clustersView-node-" + node.id).style.border = "solid 3px "+ this.graph.cfg.general.selectionColor;
      }
    }
  }

  selectCluster(cluster) {
    if(document.getElementById("clustersView-cluster-" + cluster)) {
      document.getElementById("clustersView-cluster-" + cluster).style.border = "solid 3px "+ this.graph.cfg.general.selectionColor;
      this.selectedClusters.push(cluster);
    }

  }

  unSelectCluster(cluster) {
    if(document.getElementById("clustersView-cluster-" + cluster)) {
      document.getElementById("clustersView-cluster-" + cluster).style.backgroundColor = this.allClusters[cluster].color;
      //document.getElementById("clustersView-cluster-" + cluster).style.border = "none";
      this.selectedClusters.splice(this.selectedClusters.indexOf(cluster), 1);
    }
  }

  selectNode(node) {
   // document.getElementById("clustersView-node-" + node.id).style.backgroundColor = pSBC(0.45, this.allClusters[node.cluster].color);
    if(document.getElementById("clustersView-node-" + node.id)) {
      if(!this.isNodeSelected(node)) {

        this.scrollNodes(node.id);
        this.scrollClusters(node.cluster);

        document.getElementById("clustersView-node-" + node.id).style.border = "solid 3px "+ this.graph.cfg.general.selectionColor;
      } else {
        this.unSelectNode(node);
      }
    }
  //  document.getElementById("clustersView-node-" + node.id).style.border = "solid 1px #000";

  }

  unSelectNode(node) {
    //document.getElementById("clustersView-node-" + node.id).style.backgroundColor = this.allClusters[node.cluster].color;
    if(document.getElementById("clustersView-node-" + node.id)) {
      document.getElementById("clustersView-node-" + node.id).style.border = "solid 3px #fff";
      this.selectedClusters.splice(this.selectedClusters.indexOf(node.id), 1);
    }
  }

  isClusterSelected(cluster) {
    return this.selectedClusters.includes(cluster);
  }

  isNodeSelected(node) {
    return this.graph.selectedNodes.includes(node.visualNode);
  }

  unhoverAll() {
    let _this = this;
    this.currentClusters.forEach(function(cluster) {

      _this.unhoverCluster(cluster.id);
      /*
      if(!_this.isClusterSelected(cluster.id)) {
        //document.getElementById("clustersView-cluster-" + cluster.id).style.backgroundColor = _this.allClusters[cluster.id].color;
      }*/
    });
    this.currentNodes.forEach(function(node) {
      _this.unhoverNode(node);

    });

  }

  unselectAll() {
    let _this = this;
    this.currentClusters.forEach(function(cluster) {
      if(_this.isClusterSelected(cluster.id)) {
        _this.unSelectCluster(cluster.id);
      }
    });
    this.currentNodes.forEach(function(node) {
      _this.unSelectNode(node);

    });
  }


  scrollNodes(index) {
    const nodesView = document.getElementById("nodeslist");
    let listItemHeight = document.getElementById('clustersView-node-' + index).clientHeight;

    nodesView.scrollTo(0, listItemHeight * index);
  }

  scrollClusters(index) {
    const clusterView = document.getElementById("clusterslist");
    let listItemHeight = document.getElementById('clustersView-cluster-' + index).clientHeight;

    clusterView.scrollTo(0, listItemHeight * index);
  }

  lightenDarkenColor(col, amt) {
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
