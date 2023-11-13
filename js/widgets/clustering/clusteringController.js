class ClusteringController {
  clusters = [];
  data = null;
  currentClustering = null;
  clusterAmount = 12500;

  constructor() {
  }

  initializeClusters(data) {
    let index = 0;
    // let palette = ["#eda", "#ab9", "#99d", "#e8a", "#bb8", "#cec", "#ba9", "#666", "#f67", "#6aa", "#a7e", "#ddd", "#129", "#833"];
    let palette = /*[
      "#E6D690",
      "#924E7D",
      "#3F888F",
      "#00BB2D",
      "#E4A010",
      "#424632",
      "#734222",
      "#DE4C8A",
      "#0E294B",
      "#1B5583",
      "#F4A900",
      "#CB2821",
      "#025669",
      "#1F3438",
      "#102C54",
      "#FAD201",
      "#968263",
      "#148471",
      "#D68787",
      "#C0B2A9",
      "#F8A52E",
      "#B57F78",
      "#F4A69B",
      "#FB7A86",
      "#E9E0CE",
      "#6AC7CE",
      "#E07C62",
      "#65956B",
      "#B30F4A",
      "#A11311",
      "#353837",
      "#67152A",
      "#B3CF91",
      "#67998D",
      "#3E685C",
      "#202727",
      "#374C5A",
      "#A3D1C0",
      "#F7E6BF",
      "#84725E",
      "#323641",
      "#D9C5B1",
      "#C4814A",
      "#A9B559",
      "#E6BB27",
      "#F1752A",
      "#7D9D77",
      "#ACAA9B",
      "#9E4440",
      "#5B8687",
      "#115265",
      "#05203E",
      "#CD8062",
      "#978A89",
      "#ECBD5A",
      "#474532",
      "#927948",
      "#576C6C",
      "#F39185",
      "#96B695",
      "#6ACE90",
      "#07A68A",
      "#937474",
      "#553343",
      "#989192",
      "#A68458"





      "#20b2aa","#9acd32","#cd5c5c","#696969",
      "#6b8e23","#ff69b4","#0000ff","#adff2f",
      "#da70d6","#d8bfd8","#b0c4de","#228b22",
      "#2f4f4f","#90ee90","#ff1493","#7b68ee",
      "#2e8b57","#228b22","#800000","#191970",
      "#006400","#808000","#483d8b","#b22222",
      "#5f9ea0","#778899","#3cb371","#bc8f8f",
      "#663399","#008080","#bdb76b","#cd853f",
      "#4682b4","#d2691e","#696969","#2f4f4f",
      "#556b2f","#9acd32","#20b2aa","#cd5c5c",
      "#00008b","#4b0082","#32cd32","#daa520",
      "#7f007f","#8fbc8f","#b03060","#d2b48c",
      "#66cdaa","#9932cc","#ff0000","#ff8c00",
      "#ffa500","#ffd700","#ffff00","#c71585",
      "#0000cd","#7cfc00","#40e0d0","#00ff00",
      "#9400d3","#ba55d3","#00fa9a","#00ff7f",
      "#4169e1","#dc143c","#00ffff","#00bfff",
      "#9370db","#ff7f50","#ff00ff","#db7093",
      "#f0e68c","#fa8072","#ffff54","#6495ed",
      "#dda0dd","#556b2f","#8b4513","#6b8e23",
      "#ffa07a","#afeeee","#87cefa","#7fffd4",
      "#2e8b57","#ffe4c4","#ffc0cb"








    ]*/

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
        '#808000', '#2e8b57', '#da70d6', '#dc143c']

    for (let i = 0; i < this.clusterAmount; i++) {

      let group = "none";

      if(data.groups) {
        let key = Array.from(data.groups.keys())[i];
        group = key;
      }

      this.clusters.push({id: i, color: palette[index], name: "cluster " + i, group: group, members: 0})
      if (++index >= palette.length) index = 0;
    }

    return this.clusters;
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
        louvainGraph.links.push({id: louvainNodeMap.get(link.source) + "-" + louvainNodeMap.get(link.target), source: louvainNodeMap.get(link.source), target: louvainNodeMap.get(link.target)});
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
