class ClusteringController {
  clusters = [];
  data = null;
  currentClustering = null;
  clusterAmount = 12500;
  palette = [];

  constructor() {


  }

  initializeClusters(data) {
    let _this = this;
    let index = 0;

    if (localStorage.getItem('palette') !== null) {
      this.palette = JSON.parse(localStorage.getItem('palette'));
    } else {
      this.initPalette();
    }

    for (let i = 0; i < this.clusterAmount; i++) {

      let group = "none";

      if (data.groups) {
        let key = Array.from(data.groups.keys())[i];
        group = key;
      }

      this.clusters.push({id: i, color: this.palette[index], name: "cluster " + i, group: group, members: 0})
      if (++index >= this.palette.length) index = 0;
    }


    let colors = this.palette.slice(0, 8);

    // Fill the color picker with color boxes
    colors.forEach(function (color, index) {
      var colorBox = document.createElement('input');
      colorBox.type = 'color';
      colorBox.className = 'color-box';
      colorBox.id = 'color-box-' + index;
      colorBox.value = color;
      colorBox.addEventListener('change', function () {
        _this.setPaletteEntry(index, this.value);
      });
      document.getElementById('color-picker').appendChild(colorBox);
    });

    document.getElementById('resetColorsButton').addEventListener('click', function () {
      _this.initPalette();
    });

    return this.clusters;
  }

  initPalette() {
    let _this = this;
    this.palette =
      ['#a6cee3',
        '#1f78b4',
        '#b2df8a',
        '#33a02c',
        '#fb9a99', '#e31a1c', '#fdbf6f',
        '#ff7f00', '#cab2d6', '#6a3d9a',
        '#ffff99', '#b15928',

        '#dede99', '#24b8b8', '#cd5c5c',


        '#696969',
        '#32cd32', '#8b4513',
        '#191970', '#ffd700', '#d8bfd8', '#ba55d3',
        '#9932cc', '#bc8f8f', '#90ee90', '#00bfff',
        '#c71585', '#ff7f50', '#00ffff', '#db7093',
        '#afeeee', '#ff8c00', '#00ff7f', '#20b2aa',
        '#cd5c5c', '#483d8b', '#9acd32', '#2f4f4f',
        '#ff0000', '#5f9ea0', '#ffc0cb', '#00ff00',
        '#f0e68c', '#dda0dd', '#7fffd4', '#b0c4de',
        '#ffff00', '#adff2f', '#556b2f', '#9370db',
        '#ffa07a', '#4169e1', '#40e0d0', '#778899',
        '#cd853f', '#d2691e', '#800000', '#ff1493',
        '#6b8e23', '#00fa9a', '#fa8072', '#8fbc8f',
        '#7b68ee', '#3cb371', '#d2b48c', '#7cfc00',
        '#4b0082', '#228b22', '#556b2f',
        '#9acd32', '#66cdaa', '#ffa500', '#0000ff',
        '#ffe4c4', '#00008b', '#bdb76b',
        '#6495ed', '#9400d3', '#228b22',
        '#7f007f', '#b22222', '#663399', '#2e8b57',
        '#0000cd', '#daa520', '#4682b4', '#ff69b4',
        '#6b8e23', '#87cefa', '#2f4f4f', '#ff00ff',
        '#b03060', '#008080', '#006400',
        '#808000', '#2e8b57', '#da70d6', '#dc143c'];
    localStorage.setItem('palette', JSON.stringify(this.palette));


    let colors = this.palette.slice(0, 8);

    // Fill the color picker with color boxes
    colors.forEach(function (color, index) {
      _this.setPaletteEntry(index, color);

      document.getElementById('color-box-' + index).value = color;
    });
  }

  setPaletteEntry(index, value) {
    this.palette[index] = value;

    this.clusters[index].color = value;
    localStorage.setItem('palette', JSON.stringify(this.palette));
  }

  changeClustering(logicalGraph, newClustering) {
    // compute CNM only on selection
    /*
    if (newClustering === "CNM (slow)" && newClustering !== this.currentClustering) {
      if (!this.data) {
        return;
      }
      this.computeCNMClustering(this.data);
    }*/

    //make selected clustering the active cluster of each node
    logicalGraph.nodes2.forEach(function (n) {
      n.cluster = n.clusterings[newClustering];
      n.visualNode.cluster = n.clusterings[newClustering];
      //n.clusterings[newClustering].members++;
    });

    this.currentClustering = newClustering;
  }

  preComputeAllClusterings(graph) {
    this.data = graph;

    this.computeNoneClustering(graph);
    this.computeGroupClustering(graph)
    this.computeLouvainClustering(graph);
    // computeCNMClustering(graph); this is very slow for large graphs so we do not pre compute it but rather compute it on selection
  }

  computeNoneClustering(graph) {
    graph.timeslices.forEach(function (slice) {
      slice.nodes2.forEach(n => n.clusterings["None"] = 0);
    });
  }

  computeGroupClustering(graph) {
    let _this = this;
    graph.timeslices.forEach(function (slice) {
      slice.nodes2.forEach(function (n) {
        n.clusterings["Labels"] = n.group;
      });
    });
  }

  computeLouvainClustering(graph) {
    graph.timeslices.forEach(function (slice, i) {

      let node_data = [];
      let link_data = [];
      let init_part = {};


      let louvainGraph = {nodes: [], links: []}
      let louvainNodeMap = new Map();


      let index = 0;
      slice.nodes2.forEach(function (node) {


        louvainNodeMap.set(node.id, index);
        // node.id2 = index;
        louvainGraph.nodes[index] = {id: index};
        index++;
      });


      slice.links2.forEach(function (link) {
        louvainGraph.links.push({
          id: louvainNodeMap.get(link.source) + "-" + louvainNodeMap.get(link.target),
          source: louvainNodeMap.get(link.source),
          target: louvainNodeMap.get(link.target)
        });
      });


      louvainGraph.nodes.forEach(function (n) {
        node_data.push(n.id);
        if (i === 0) {
          init_part[n.id] = n.id;
        } else {
          let prevNode = graph.timeslices[i - 1].nodes2.get(n.name) //getVisualNodeById(graph.timeslices[i - 1].nodes, n.id);
          init_part[n.id] = prevNode ? prevNode.clusterings["Louvain"] : slice.nodes.length + 1 + n.id;
        }
      });

      louvainGraph.links.forEach(l => link_data.push({source: l.source, target: l.target, weight: 1}));

      let community = jLouvain()
        .nodes(node_data)
        .edges(link_data)
        .partition_init(init_part);
      let result = community();


      slice.nodes2.forEach(function (n, ind) {

        if (result && result !== 0) {
          let index = louvainNodeMap.get(n.id);
          n.clusterings["Louvain"] = result[index];
        } else if (result === 0) {
          n.clusterings["Louvain"] = ind;
        }


      });

    });
  }

  computeCNMClustering(graph) {
    graph.timeslices.forEach(function (slice) {
      let node_data = [];
      let link_data = [];

      slice.nodes.forEach(function (n) {
        node_data.push({name: n.name, id: n.id});
      });
      slice.links.forEach(function (l) {
        link_data.push({
          source: node_data.indexOf(getNodeById(node_data, l.source)),
          target: node_data.indexOf(getNodeById(node_data, l.target)),
          count: 1
        });
      });

      netClustering.cluster(node_data, link_data);

      slice.nodes.forEach(function (d) {
        let node_data_node = getNodeById(node_data, d.id)
        d.clusterings["CNM (slow)"] = parseInt(node_data_node.cluster);
      });

    });
  }

  getCurrentClusters(logicalGraph, clustering) {
    let _this = this;
    let currentClusters = [];

    _this.clusters.forEach(function (cluster) {
      cluster.members = 0;
    });

    logicalGraph.nodes2.forEach(function (n) {

      let cluster = _this.clusters[n.clusterings[clustering]];

      cluster.members++;

      if (!currentClusters.includes(cluster)) {
        currentClusters.push(cluster);
      }
    });
    return currentClusters;
  }

}
