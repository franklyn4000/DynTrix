class ReorderingController {
  constructor() {
  }

  getOrdering(orderingName, subMatrix, dynGraph) {

    let adjacency = subMatrix.map(function (row) {
      return row.map(function (c) {
        return c.z;
      });
    });

    switch (orderingName) {
      case 'Reverse Cuthill-McKee':
        return this.computeReverseCuthillMcKeeOrder(adjacency);
      case 'Spectral':
        return this.computeSpectralOrder(adjacency);
      case 'Barycenter':
        return this.computeBarycenterOrder(adjacency);
      case 'Optimal Leaf Ordering':
        return this.computeOptimalLeafOrder(adjacency);
      case 'Volatility-Based':
        return this.computeVolatilityBasedOrder2(subMatrix, adjacency, dynGraph);
      default:
        return d3.range(subMatrix.length);
    }
  }

  computeOptimalLeafOrder(adjacency) {
    let leafOrder = reorder.optimal_leaf_order()
      .distance(reorder.distance.manhattan);

    let graph = reorder.mat2graph(adjacency, false);
    let nodes = graph.nodes();

    let order = leafOrder(adjacency);

    order.forEach((lo, i) => nodes[i].leafOrder = lo);
    return nodes.map(n => n.leafOrder);
  }

  computeBarycenterOrder(adjacency) {
    let graph = reorder.mat2graph(adjacency, false);
    let nodes = graph.nodes();

    let barycenter = reorder.barycenter_order(graph),
      improved = reorder.adjacent_exchange(graph,
        barycenter[0],
        barycenter[1]);

    improved[0].forEach((lo, i) => nodes[i].barycenter = lo);
    return nodes.map(n => n.barycenter);
  }

  computeSpectralOrder(adjacency) {
    let graph = reorder.mat2graph(adjacency, false);
    let nodes = graph.nodes();
    let spectral = reorder.spectral_order(graph);

    spectral.forEach((lo, i) => nodes[i].spectral = lo);
    return nodes.map(n => n.spectral);
  }

  computeReverseCuthillMcKeeOrder(adjacency) {
    let graph = reorder.mat2graph(adjacency, false);
    let nodes = graph.nodes();
    let rcm = reorder.reverse_cuthill_mckee_order(graph);

    rcm.forEach((lo, i) => nodes[i].rcm = lo);
    return nodes.map(n => n.rcm);
  }

  computeVolatilityBasedOrder(subMatrix, adjacency, dynGraph) {

    let order = [];

    let volatility = subMatrix.map(function (row) {
      return row.map(function (c, i) {
        return {id:i, vol: 0};
      });
    });

    dynGraph.timeslices.forEach(function (slice){
      subMatrix.forEach(function (row, i){
        let node = subMatrix[i][i].node;
        if(slice.nodes2.has(node.id)) {
          volatility[i][i].vol++;
        }
      });
    });

    dynGraph.timeslices.forEach(function (slice){
      subMatrix.forEach(function (row, i){
        order[i] = volatility[i][i];
      });
    });

    order.sort((a, b) => a.vol - b.vol);
    order = sortIntoMiddle(order);

    return order.map(n => n.id);
  }

  computeVolatilityBasedOrder2(subMatrix, adjacency, dynGraph) {

    let order = [];

    let volatility = subMatrix.map(function (row) {
      return row.map(function (c, i) {
        return {id:i, vol: 0};
      });
    });


    for(let i = 1; i < dynGraph.timeslices.length; i++) {
      let slice = dynGraph.timeslices[i];
      let prevSlice = dynGraph.timeslices[i-1];

      subMatrix.forEach(function (row, i){
        let node = subMatrix[i][i].node;
        if(slice.nodes2.has(node.id) && !prevSlice.nodes2.has(node.id) || !slice.nodes2.has(node.id) && prevSlice.nodes2.has(node.id)) {
          volatility[i][i].vol++;
        }
      });
    }
    console.log(volatility)

    dynGraph.timeslices.forEach(function (slice){
      subMatrix.forEach(function (row, i){
        order[i] = volatility[i][i];
        subMatrix[i][i].volatility = volatility[i][i].vol;
      });
    });
    console.log(order)


    order.sort((b, a) => a.vol - b.vol);
    order = sortIntoMiddle(order);



    return order.map(n => n.id);
  }

}



class OrderStore {
  orders = [];
  current = 0;

  constructor() {
  }

  set order(order) {
    this.current = this.incCurrent();
    this.orders[this.current] = order;
  }

  get order() {
    return this.orders[this.current];
  }

  get oldOrder() {
    if (this.orders.length < 2) {
      return null;
    }
    return this.orders[this.incCurrent()];
  }

  incCurrent() {
    return this.current === 0 ? 1 : 0;
  }

}
