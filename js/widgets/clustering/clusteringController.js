class ClusteringController {
  clusters = [];
  data = null;
  currentClustering = null;
  clusterAmount = 500;

  constructor() {
  }

  initializeClusters(data) {
    let index = 0;
    // let palette = ["#eda", "#ab9", "#99d", "#e8a", "#bb8", "#cec", "#ba9", "#666", "#f67", "#6aa", "#a7e", "#ddd", "#129", "#833"];
    let palette = [
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
    ]

    let groups = extractAllGroups(data);

    for (let i = 0; i < this.clusterAmount; i++) {
      let group = "none";

      if (i < groups.length) group = groups[i];

      this.clusters.push({id: i, color: palette[index], name: "cluster " + i, group: group})
      if (index++ > palette.length) index = 0;
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
        n.clusterings["Labels"] = _this.getClusterByGroupName(n.group);
      });
    });
  }

  computeLouvainClustering(graph) {

    graph.timeslices.forEach(function (slice, i) {
      let node_data = [];
      let link_data = [];
      let init_part = {};

      slice.nodes2.forEach(function (n) {
        node_data.push(n.id);
        if (i === 0) {
          init_part[n.id] = n.id;
        } else {
          let prevNode = graph.timeslices[i - 1].nodes2.get(n.name) //getVisualNodeById(graph.timeslices[i - 1].nodes, n.id);
          init_part[n.id] = prevNode ? prevNode.clusterings["Louvain"] : slice.nodes.length + 1 + n.id;
        }
      });

      slice.links2.forEach(l => link_data.push({source: l.source, target: l.target, weight: 1}));

      let community = jLouvain()
        .nodes(node_data)
        .edges(link_data)
        .partition_init(init_part);
      let result = community();

      slice.nodes2.forEach(function (n) {
        if (result && result !== 0) {
          n.clusterings["Louvain"] = result[n.id];
        } else {
          n.clusterings["Louvain"] = 0;
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

    logicalGraph.nodes2.forEach(function (n) {

      let cluster = _this.clusters[n.clusterings[clustering]];

      if (!currentClusters.includes(cluster)) {
        currentClusters.push(cluster);
      }
    });
    return currentClusters;
  }

  getClusterByGroupName(name) {
    let result = 0;

    this.clusters.forEach(function (n) {
      if (n.group === name) {
        result = n.id;
      }
    });
    return result;
  }
}
