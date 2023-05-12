async function parseCharriere() {
  let graph = await readCharrierefiles();

  return graph;
}

class CharriereDate {
  year;
  month;
  day;
  compareVal;

  constructor(dateString) {
    let tokens = dateString.split("-");

    this.year = parseInt(tokens[0]);
    this.month = parseInt(tokens[1]);
    this.day = parseInt(tokens[2]);

    this.compareVal = this.year * 365 + this.month * 12 + this.day;
  }

}

async function readCharrierefiles() {
  let files = [];


  files.push(await readFile("data/charriere/merged_people_file.txt"));
  files.push(await readFile("data/charriere/merged_letters_file.txt"));
  files.push(await readFile("data/charriere/letter_to_people_file.txt"));


  let graph = parseCharriereGraph(files, 8, 3050, 0);

  return graph;
}

function parseCharriereGraph(files, sliceYears, letterDuration, participantDuration) {
  let graph = {};
  graph.timeslices = [];
  let nodeMap = new Map();

  let startTime = new CharriereDate("3000-12-12");
  let endTime = new CharriereDate("1000-12-12");

  let peopleFile = files[0]
  for (let i = 0; i < peopleFile.length; i++) {
    let line = peopleFile[i];
    console.log(line)
    let node = {name: line.name, group: 1, id: line.id};
    nodeMap.set(parseInt(line.id), node);
  }

  let lettersFile = files[1]
  for (let i = 0; i < lettersFile.length; i++) {
    let line = lettersFile[i];
    let cDate = new CharriereDate(line.date)

    if(cDate.compareVal > endTime.compareVal) {
      endTime = cDate;
    }
    if(cDate.compareVal < startTime.compareVal) {
      startTime = cDate;
    }
  }

  for (let i = startTime.year; i < endTime.year + sliceYears; i += sliceYears) {
    let timeslice = {tag: i + "-" + (i + sliceYears - 1), nodes: new Map(), links: [], intervalStart: new CharriereDate(i + "-1-1").compareVal, intervalEnd: new CharriereDate((i + sliceYears - 1) + "-1-1").compareVal};
    graph.timeslices.push(timeslice);
  }

  for (let i = 0; i < lettersFile.length; i++) {
    let line = lettersFile[i];
    let cDate = new CharriereDate(line.date)


    let source = nodeMap.get(parseInt(line.source));
    let target = nodeMap.get(parseInt(line.target));


    let participantPresenceStart = cDate.compareVal - participantDuration;
    let participantPresenceEnd = cDate.compareVal + letterDuration + participantDuration;

    let dialogIntervalStart = cDate.compareVal;
    let dialogIntervalEnd = cDate.compareVal + letterDuration;


    graph.timeslices.forEach(function (slice, sliceId) {
      let sourceNode = {name: source.name, group: 1, id: parseInt(source.id)};
      let targetNode = {name: target.name, group: 1, id: parseInt(target.id)};


      if(slice.intervalEnd >= participantPresenceStart && slice.intervalStart <= participantPresenceEnd) {
        slice.nodes.set(sourceNode.id, sourceNode);
        slice.nodes.set(targetNode.id, targetNode);
      }

      let edge;
      if (source.id > target.id) {
        edge = {source: parseInt(source.id), target: parseInt(target.id), value: 1, id: i};
      } else {
        edge = {source: parseInt(target.id), target: parseInt(source.id), value: 1, id: i};
      }

      if(slice.intervalEnd >= dialogIntervalStart && slice.intervalStart <= dialogIntervalEnd) {
        slice.links.push(edge);
      }

    });
  }
  graph.timeslices.forEach(function (slice, sliceId) {
    const nodesArray = Array.from(slice.nodes.values());
    slice.nodes = nodesArray;
  });

  return graph;

}
