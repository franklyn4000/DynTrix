async function parseMooc() {
  let graph = null;


  await d3.tsv("data/mooc_actions.tsv")
    .then(function(data) {


      graph = parseMoocGraph(data,100, 50, 8000)
      console.log(data)

    })
    .catch(function(error){
      console.log(error);
    })

  console.log(graph)
  return graph;
}


function parseMoocGraph(data, messageDuration, timeSlices, events) {
  let eventsProcessed = 0;
  let minEpoch = Number.MAX_VALUE;
  let maxEpoch = Number.MIN_VALUE;

  let graph = {};
  graph.timeslices = [];

  let fullDuration = messageDuration;


  let nodeMap = new Map();

  for (let i = 1; i < data.length; i++) {
    let line = data[i];
    let idSource = line.USERID;
    let idTarget = line.TARGETID;

    if (idSource === idTarget)
      continue;

    let epoch = Math.round(line.TIMESTAMP) + fullDuration;

    minEpoch = Math.min(minEpoch, epoch);
    maxEpoch = Math.max(maxEpoch, epoch);
    
    eventsProcessed++;

    if(eventsProcessed === events) {
      break;
    }

  }

  eventsProcessed = 0;

  const firstTime = moment().milliseconds(minEpoch);
  const lastTime = moment().milliseconds(maxEpoch);

  let intervalMs =  lastTime.diff(firstTime, 'milliseconds')
  let msPerTimeslice = intervalMs / timeSlices;

  console.log(firstTime)
  console.log(lastTime)

  console.log(intervalMs)

  console.log(msPerTimeslice)

  for(let i = 0; i < timeSlices; i++) {
    let sliceTime = firstTime.clone();
    sliceTime.add(Math.floor(msPerTimeslice * i), 'milliseconds');

    let sliceName = firstTime.clone().add(Math.floor(msPerTimeslice * i), 'days').milliseconds();

    graph.timeslices.push({tag: sliceName, nodes: [], links: [], time: sliceTime});
  }


  for (let i = 1; i < data.length; i++) {
    let line = data[i];
    let idSource = line.USERID;
    let idTarget = line.TARGETID;

    if (idSource === idTarget)
      continue;

    let epoch = moment().milliseconds(Math.round(line.TIMESTAMP) + fullDuration);

    if (!nodeMap.has(idSource)) {
      let node = {name: idSource, group: 1, id: idSource};
      nodeMap.set(idSource, node);

      graph.timeslices.forEach(function (slice, sliceId) {
        let sliceIntervalStart = epoch.clone().subtract(fullDuration, 'milliseconds');
        let sliceIntervalEnd = epoch.clone().add(fullDuration, 'milliseconds');

        if(epoch.isBetween(sliceIntervalStart, sliceIntervalEnd)) {
          slice.nodes.push(node);
        }
      });

    }
    if (!nodeMap.has(idTarget)) {
      let node = {name: idTarget, group: 1, id: idTarget};
      nodeMap.set(idTarget, node);

      graph.timeslices.forEach(function (slice, sliceId) {
        let sliceIntervalStart = epoch.clone().subtract(fullDuration, 'milliseconds');
        let sliceIntervalEnd = epoch.clone().add(fullDuration, 'milliseconds');

        if(epoch.isBetween(sliceIntervalStart, sliceIntervalEnd)) {
          slice.nodes.push(node);
        }
      });
    }

    let source = nodeMap.get(idSource).id;
    let target = nodeMap.get(idTarget).id;

    let edge;
    if (source > target) {
      edge = {source: source, target: target, value: 1, id: i};
    } else {
      edge = {source: target, target: source, value: 1, id: i};
    }



    graph.timeslices.forEach(function (slice, sliceId) {

      let sliceIntervalStart = epoch.clone().subtract(fullDuration, 'milliseconds');
      let sliceIntervalEnd = epoch.clone().add(fullDuration, 'milliseconds');


      if(epoch.isBetween(sliceIntervalStart, sliceIntervalEnd) && !isLinkInTimeSlice(source, target, slice.links)) {
        slice.links.push(edge);
      }
    });

    eventsProcessed++;

    if(eventsProcessed === events) {
      break;
    }

  }
  return graph

  console.log(nodeMap)

}
