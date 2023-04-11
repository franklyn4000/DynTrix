async function parseDialog() {
  let graph = await readDialogfiles();

  return graph;
}

async function readDialogfiles() {
  let files = [];

  for (let i = 1; i < 62; i++) {
    let index = i;
    if(i < 10){
      index = "0" + i;
    }
    files.push(await readTSVFile("data/dialog/chapter_" + index + ".txt"))
  }

  let dataset = parseDialogs(files);

  let graph = parseDialogGraph(dataset, 1, null);

  return graph;
}

class DialogDataset {

  dialogs = [];
  characters = new Set();
  startTime = Number.POSITIVE_INFINITY;
  endTime = Number.NEGATIVE_INFINITY;
}

class Dialog {

  source;
  target;
  time;
  nominalDuration;
}


function parseDialogGraph(dataset, dialogDuration, mode) {
  let graph = {};
  graph.timeslices = [];

  let nodeMap = new Map();


  for (let i = dataset.startTime; i < dataset.endTime; i++) {
    let timeslice = {tag: i, nodes: [], links: [], intervalStart: i, intervalEnd: i + 1};
    graph.timeslices.push(timeslice);
  }

  dataset.characters.forEach(function (character, i) {
    let node = {name: character, group: 1, id: i};
    nodeMap.set(character, node);
  });

  dataset.dialogs.forEach(function (dialog, i) {
    let source = nodeMap.get(dialog.source);
    let target = nodeMap.get(dialog.target);

    let participantPresenceStart = dialog.time - dialogDuration * dialog.nominalDuration * 10.0;
    let participantPresenceEnd = dialog.time + dialogDuration * dialog.nominalDuration * 11.0;

    let dialogIntervalStart = dialog.time;
    let dialogIntervalEnd = dialog.time + dialogDuration * dialog.nominalDuration;

    graph.timeslices.forEach(function (slice, sliceId) {
      let sourceNode = {name: source.name, group: 1, id: source.id};
      let targetNode = {name: target.name, group: 1, id: target.id};

      if(slice.intervalEnd >= participantPresenceStart && slice.intervalStart <= participantPresenceEnd) {
        slice.nodes.push(sourceNode);
        slice.nodes.push(targetNode);
      }

      let edge;
      if (source.id > target.id) {
        edge = {source: source.name, target: target.name, value: 1, id: i};
      } else {
        edge = {source: target.name, target: source.name, value: 1, id: i};
      }
      if(slice.intervalEnd >= dialogIntervalStart && slice.intervalStart <= dialogIntervalEnd) {
        slice.links.push(edge);
      }

    });
  });

  return graph;
}

function parseDialogs(files) {
  let dataset = new DialogDataset();

  files.forEach(function (file, chapter) {
    let fileDialogs = [];

    for (const [key, value] of Object.entries(file)) {
      let dialog = new Dialog();
      dialog.source = Object.values(value)[0];
      dialog.target = Object.values(value)[1];
      dataset.characters.add(Object.values(value)[0]);
      dataset.characters.add(Object.values(value)[1]);
      fileDialogs.push(dialog);
    }

    dataset.startTime = Math.min(dataset.startTime, chapter);
    dataset.endTime = Math.max(dataset.endTime, chapter + 1);

    let order = 0;
    fileDialogs.forEach(function (dialog) {
      dialog.nominalDuration = 1.0 / fileDialogs.length;
      dialog.time = chapter + order * dialog.nominalDuration;
      dataset.dialogs.push(dialog);
      order++;
    });

  });

  return dataset;
}
