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

      node.appendChild(radioGroup);
    });

  }

  getClustering() {
    return this.currentAlg;
  }

}
