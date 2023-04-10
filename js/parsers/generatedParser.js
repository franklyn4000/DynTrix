async function parseGenerated(name, timeslices) {
  let data = await d3.json("data/" + name + ".json");
  return parseGeneratedGraph(data, timeslices);
}


function parseGeneratedGraph(data, timeslices) {
  let clusteringController = new ClusteringController();

  let graph = {};
  graph.timeslices = [];

  data.nodes.forEach(function (n) {
    n.clusterings = [];
    n.name = "node " + n.id;
    n.group = 1;
  });


  data.links.forEach(function (l, i) {
    l.value = 1;
    l.id = i;
  });

  let sliceNodes = [];
  let sliceLinks = [];

  data.nodes.forEach(function (n) {
    sliceNodes.push(n);
  });

  data.links.forEach(function (l) {
    sliceLinks.push(l);
    if (getNodeById(sliceNodes, l.source) && getNodeById(sliceNodes, l.target)) {

    }
  });

  graph.timeslices.push({tag: "slice " + 0, nodes: sliceNodes, links: sliceLinks})


 // clusteringController.computeLouvainClustering(graph);

  for (let i = 1; i < 5; i++) {
    let sliceNodes = [];
    let sliceLinks = [];

    data.nodes.forEach(function (n) {

    //  if (n.clusterings["Louvain"] !== i - 1) {
        if (Math.random() > 0) {


          if(i === 1) {
            if(![4, 6, 12, 13, 14, 9, 10].includes(n.id)) {
              sliceNodes.push(n);
            }
          } else if(i === 2) {
            if(![5, 6, 12, 13, 9, 10, 11, 8].includes(n.id)) {
              sliceNodes.push(n);
            }
          } else if(i === 3) {
            if(![4, 5, 6, 11, 8].includes(n.id)) {
              sliceNodes.push(n);
            }
          } else if(i === 4) {
            if (![2, 12, 13].includes(n.id)) {
              sliceNodes.push(n);
            }
          } else {
            sliceNodes.push(n);
          }



        }
  //    }
    });

    data.links.forEach(function (l) {
      if (getNodeById(sliceNodes, l.source) && getNodeById(sliceNodes, l.target)) {
        sliceLinks.push(l);
      }
    });

    graph.timeslices.push({tag: "slice " + i, nodes: sliceNodes, links: sliceLinks})

  }

  return graph;
}
