class ClusteringView {
  graph = null;
  clusterAlgorithms = [];
  currentAlg = null;

  constructor() {
  }

  setGraph(graph) {
    this.graph = graph;
  }

  setupClusterings(clusterAlgorithms) {
    let _this = this;
    this.clusterAlgorithms = clusterAlgorithms;
    this.currentAlg = this.clusterAlgorithms[0];

    const node = document.getElementById("clustering");
    node.innerHTML = '';

    this.clusterAlgorithms.forEach(function (clusterAlg, i) {
      let radioGroup = document.createElement("div");
      radioGroup.classList.add("radiogroup", "row", "jleft", "acenter");

      let radioBtn = document.createElement("input");
      radioBtn.setAttribute("type", "radio");
      radioBtn.id = clusterAlg + ' clustering'
      radioBtn.name = 'clustering';
      radioBtn.value = clusterAlg;
      radioBtn.onclick = function () {
        _this.currentAlg = clusterAlg
        _this.graph.updateClustering(clusterAlg);
      };

      if (i === 0) {
        radioBtn.checked = true;
      }
      radioGroup.appendChild(radioBtn);



      let btnLabel = document.createElement("label");
      btnLabel.for = clusterAlg + 'clustering';
      btnLabel.textContent = clusterAlg;
      radioGroup.appendChild(btnLabel);

      let tooltip = document.createElement("div");
      tooltip.classList.add("tooltip");
      tooltip.innerHTML = '&#9432;';
      let tooltiptext = document.createElement("span");
      tooltiptext.classList.add("tooltiptext");
      tooltiptext.innerHTML = _this.getTooltipText(clusterAlg);
      tooltip.appendChild(tooltiptext);
      radioGroup.appendChild(tooltip);

      node.appendChild(radioGroup);
    });

  }

  getTooltipText(alg) {
    switch (alg) {
      case 'None':
        return "Sort Rows by id";
      case 'Spectral':
        return "Linear algebra approach. Good at highlighting clusters. Bad when data has many outliers or cycles.";
      case 'Barycenter':
        return "Heuristic approach. Good tradeoff between quality and performance.";
      case 'Optimal Leaf Ordering':
        return "Robinsonian (statistic) approach. High visual quality of patterns, low performance.";
      case 'Reverse Cuthill-McKee':
        return "Graph-theoretic approach. Very fast, inconsistent visual quality.";
      default:
        return "invalid tooltip";
    }

  }
  getClustering() {
    return this.currentAlg;
  }

}
