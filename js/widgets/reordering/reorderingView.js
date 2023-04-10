class ReorderingView {
  graph = null;
  reorderAlgorithms = [];
  currentAlg = null;

  constructor() {
  }

  setGraph(graph) {
    this.graph = graph;
  }

  setupReorderings(reorderAlgorithms) {
    let _this = this;
    this.reorderAlgorithms = reorderAlgorithms;
    this.currentAlg = this.reorderAlgorithms[0];

    const node = document.getElementById("reordering");
    node.innerHTML = '';

    this.reorderAlgorithms.forEach(function (reorderAlg, i) {
      let radioGroup = document.createElement("div");
      radioGroup.classList.add("radiogroup");
      radioGroup.classList.add("row");
      radioGroup.classList.add("jleft");
      radioGroup.classList.add("acenter");

      let radioBtn = document.createElement("input");
      radioBtn.setAttribute("type", "radio");
      radioBtn.id = reorderAlg + 'reordering'
      radioBtn.name = 'reordering';
      radioBtn.value = reorderAlg;
      radioBtn.onclick = function () {
        _this.currentAlg = _this.reorderAlgorithms[i]
        _this.graph.updateOrdering(_this.reorderAlgorithms[i]);
      };

      if(i === 0) {
        radioBtn.checked = true;
      }
      radioGroup.appendChild(radioBtn);

      let btnLabel = document.createElement("label");
      btnLabel.for = reorderAlg + 'clustering';
      btnLabel.textContent = reorderAlg;
      radioGroup.appendChild(btnLabel);

      let tooltip = document.createElement("div");
      tooltip.classList.add("tooltip");
      tooltip.innerHTML = '&#9432;';
      let tooltiptext = document.createElement("span");
      tooltiptext.classList.add("tooltiptext");
      tooltiptext.innerHTML =_this.getTooltipText(reorderAlg);
      tooltip.appendChild(tooltiptext);
      radioGroup.appendChild(tooltip);

      node.appendChild(radioGroup);

    });
  }

  getReordering() {
    return this.currentAlg;
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

}
