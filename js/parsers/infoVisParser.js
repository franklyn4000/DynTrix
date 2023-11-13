
async function parseInfoVis(persistNodes, persistEdges, minYear, agg) {
  let graph = null;

  await d3.csv("data/infovis-citation-data.txt")
    .then(function(data) {

      let papers = parsePapers(data);
      graph = parseGraph(papers, persistNodes, persistEdges, minYear, agg);


    })
    .catch(function(error){
      console.log(error);
    })


  return graph;
}


function parseGraph(papers, persistNodes, persistEdges, minYear, agg) {

  let graph = {};
  graph.timeslices = [];


  let firstYear = Number.MAX_VALUE;
  let lastYear = Number.MIN_VALUE;
/*
  if(persistNodes) {
    for (const paper of papers.values()) {
      firstYear = Math.min(firstYear, paper.year);
      lastYear = Math.max(lastYear, paper.year);
    }
  }
*/


  for (const paper of papers.values()) {

    if(paper.year < minYear) {
      continue;
    }

    firstYear = Math.min(firstYear, paper.year);
    lastYear = Math.max(lastYear, paper.year);
  }


  createTimeslices(graph, firstYear, lastYear, agg);


  for (const paper of papers.values()) {

    if(paper.year < minYear) {
      continue;
    }

    let coAuthors = [];


    paper.authors.forEach(function (author, i) {

      createNode(graph, author, paper.year, lastYear, agg);

      coAuthors.forEach(function (coAuthor, i) {
        createLink(graph, author, coAuthor, paper.year, lastYear, agg);
      });

      coAuthors.push(author);
    });


  }

  return graph;
}

function createTimeslices(graph, minYear, maxYear, agg) {

  for(let year = minYear; year <= maxYear; year += agg) {
    let tag = year + " - " + (year+agg);
    graph.timeslices.push({displaytag: tag, tag: year - (minYear % agg), nodes: [], links: []})
  }

  //graph.timeslices.reverse();

}

function createNode(graph, author, y, lastYear, agg) {
  let diff = y % agg;
  y -= diff;

 // for(let year = y; year <= lastYear;) {

    let id = getNode(author, graph);
    if(id < 0) {
      id = idFactory.get('infoVisNode');
    }

    if(!isNodeInYear(id, graph, y)) {
      graph.timeslices[getTimeSliceId(graph, y)].nodes.push({name:author,group: 1, id: id})
    }
 // }


}

function createLink(graph, author, coAuthor, y, lastYear, agg) {
  let diff = y % agg;
  y -= diff;

  //for(let year = y; year <= lastYear;) {
    let source = getNodeInYear(author, graph, y);
    let target = getNodeInYear(coAuthor, graph, y);

    let id = getLink(source, target, graph);
    if(id < 0) {
      id = idFactory.get('infoVisLink');
    }

    if(!isLinkInYear(id, graph, y)) {
      graph.timeslices[getTimeSliceId(graph, y)].links.push({"source":source,"target":target,"value":1, "id": id})
    }
 // }

}

function getNode(name, graph) {
  let nodeId = -1;

  graph.timeslices.forEach(function (timeSlice, i) {
    timeSlice.nodes.forEach(function (node, i) {
      if(node.name === name) {
        nodeId = node.id;
      }
    });
  });

  return nodeId;
}

function getLink(source, target, graph) {
  let linkId = -1;
  graph.timeslices.forEach(function (timeSlice, i) {
    timeSlice.links.forEach(function (link, i) {
      if(link.source === source && link.target === target) {
        linkId = link.id;
      }
    });
  });

  return linkId;
}


function getNodeInYear(name, graph, year) {
  let timeSlice = graph.timeslices[getTimeSliceId(graph, year)];
  let nodeId = -1;

  timeSlice.nodes.forEach(function (node, i) {
    if(node.name === name) {
      nodeId = node.id;
    }
  });

  return nodeId;
}

function isNodeInYear(id, graph, year) {
  let timeSlice = graph.timeslices[getTimeSliceId(graph, year)];
  let exists = false;

  timeSlice.nodes.forEach(function (node, i) {
    if(node.id === id) {
      exists = true;
    }
  });

  return exists;
}

function isLinkInYear(id, graph, year) {
  let timeSlice = graph.timeslices[getTimeSliceId(graph, year)];
  let exists = false;

  timeSlice.links.forEach(function (link, i) {
    if(link.id === id) {
      exists = true;
    }
  });

  return exists;
}


function parsePapers(lines) {
  let paperLines = [];
  let papers = new Map();
  let onHeader = true;

  lines.forEach(function (fileLine, i) {
    let line = fileLine[""]
    if (line.startsWith("article")) {
      if (!onHeader) {
        let paper = parsePaper(paperLines);
        papers.set(paper.id, paper);
      }
      paperLines = [];
      onHeader = false;
    } else {
      paperLines.push(line);
    }
  });

  let paper = parsePaper(paperLines);
  papers.set(paper.id, paper);
  matchPapers(papers);
  return papers;

}

function parsePaper(paperLines) {
  let id = paperLines[0];
  if (!id.startsWith("infovis")) {
    console.log("The paper id seems to be incorrect: " + id);
  }

  let yearEnding = id.substring(7, 9);
  let yearBeginning = yearEnding.startsWith("9") ? "19" : "20";
  let year = parseInt(yearBeginning + yearEnding);

  let title = paperLines[3];

  let paper = new Paper(id, title, year);

  let rowIndex = 4;
  for (; rowIndex < paperLines.length; rowIndex++) {
    let line = paperLines[rowIndex];
    if (line.startsWith("concept: ")) {
      paper.concepts.push(line.replace("concept: ", "").trim());
    } else if (line.startsWith("keyword: ")) {
      paper.keywords.push(line.replace("keyword: ", "").trim());
    } else if (line.startsWith("author: ")) {
      paper.authors.push(line.replace("author: ", "").trim());
    }
    if (line.startsWith("citations")) {
      break;
    }
  }

  for (; rowIndex < paperLines.length; rowIndex++) {
    let line = paperLines[rowIndex];
    if (line.startsWith("infovis")) {
      paper.citationsId.push(line);
    }
  }
  return paper;
}

function matchPapers(papers) {


  for (const [key, paper] of papers) {
    paper.citationsId.forEach(function (citationId, i) {
      paper.citations.push(papers[citationId]);
    });
  }


}


class Paper {

  id;
  title;
  year;
  authors = [];
  concepts = [];
  keywords = [];
  citations = [];
  citationsId = [];

  constructor(id, title, year) {
    this.id = id;
    this.title = title;
    this.year = year;
  }


}
