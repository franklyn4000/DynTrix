async function parseMooc() {
  let graph = null;


  await d3.tsv("data/mooc_actions.tsv")
    .then(function(data) {


      graph = parseMoocGraph(data, 6, 300000, 5)
      console.log(graph)

    })
    .catch(function(error){
      console.log(error);
    })

  console.log(graph)
  return graph;
}


function parseMoocGraph(data, timeSlices, events, numCourses) {
  let eventsProcessed = 0;
  let minEpoch = Number.MAX_VALUE;
  let maxEpoch = Number.MIN_VALUE;

  let courseSet = [];
  for(let i = 0; i < numCourses; i++) {
    courseSet.push(i + "");
  }

  let graph = {};
  graph.timeslices = [];


  let nodeMap = new Map();
  let courseMap = new Map();

  let filteredData = [];

  //filter data
  for (let i = 1; i <= events; i++) {
    let line = data[i];
    let idTarget = line.TARGETID;

    if(courseSet.includes(idTarget)){
      filteredData.push(line);
    }

  }




  for (let i = 0; i < filteredData.length; i++) {
    let line = filteredData[i];
    let idSource = line.USERID;
    let idTarget = line.TARGETID;

    if (idSource === idTarget)
      continue;

    let epoch = Math.round(line.TIMESTAMP);

    minEpoch = Math.min(minEpoch, epoch);
    maxEpoch = Math.max(maxEpoch, epoch);

    eventsProcessed++;
    if(eventsProcessed === events) {
      break;
    }

  }

  eventsProcessed = 0;


  let intervalMs =  maxEpoch - minEpoch;
  let msPerTimeslice = Math.floor(intervalMs / timeSlices);

  fullDuration = msPerTimeslice;




  for(let i = 0; i < timeSlices; i++) {
    let sliceTime = minEpoch + msPerTimeslice * i;

    let sliceName = sliceTime + "";

    graph.timeslices.push({tag: sliceName, nodes: [], links: [], time: sliceTime});
  }



  for (let i = 0; i < filteredData.length; i++) {
    let line = filteredData[i];
    let idSource = line.USERID;
    let idTarget = line.TARGETID;

    if (idSource === idTarget)
      continue;

    let epoch = line.TIMESTAMP + fullDuration;

    if (!nodeMap.has(idSource)) {
      let node = {name: idSource, group: 1, id: idSource, epochs: [epoch]};
      nodeMap.set(idSource, node);

    } else {
      nodeMap.get(idSource).epochs.push(epoch);
    }
    if (!courseMap.has(idTarget)) {
      let node = {name: "course " + idTarget, group: 1, id: events + idTarget, epochs: [epoch]};
      courseMap.set(idTarget, node);
    } else {
      courseMap.get(idTarget).epochs.push(epoch);
    }

    eventsProcessed++;

    if(eventsProcessed === events) {
      break;
    }

  }


  nodeMap.forEach(function (node) {
    node.epochs.forEach(function (epoch) {
      graph.timeslices.forEach(function (slice, sliceId) {
        let sliceIntervalStart = slice.time - fullDuration;
        let sliceIntervalEnd = slice.time + fullDuration;
        if(epoch >= sliceIntervalStart && epoch <= sliceIntervalEnd) {
          slice.nodes.push(node);
        }
      });
    });
  });

  courseMap.forEach(function (node) {

      graph.timeslices.forEach(function (slice, sliceId) {

        slice.nodes.push(node);

      });
  });

  for (let i = 0; i < filteredData.length; i++) {
    let line = filteredData[i];
    let idSource = line.USERID;
    let idTarget = line.TARGETID;

    if (idSource === idTarget)
      continue;

    let epoch = line.TIMESTAMP + fullDuration;

    let source = nodeMap.get(idSource).id;
    let target = courseMap.get(idTarget).id;

    let edge = {source: source, target: target, value: 1, id: i};

    graph.timeslices.forEach(function (slice, sliceId) {
      let sliceIntervalStart = slice.time - fullDuration;
      let sliceIntervalEnd = slice.time + fullDuration;

      if(epoch >= sliceIntervalStart && epoch <= sliceIntervalEnd) {
        slice.links.push(edge);
      }
    });

  }


  console.log(nodeMap)


  return graph



}
