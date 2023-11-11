async function parseVispub(allowedConferences, minYear, agg) {
  let graph = null;

  await d3.csv("data/infoVis2.csv")
    .then(function(data) {


      graph = parseVispubGraph(data, allowedConferences, minYear, agg);

    })
    .catch(function(error){
      console.log(error);
    })


  return graph;
}

let groups = new Map();

function parseVispubGraph(papers, allowedConferences, minYear, agg) {

  let graph = {};
  graph.timeslices = [];


  let firstYear = Number.MAX_VALUE;
  let lastYear = Number.MIN_VALUE;


  let limit = 0;


  for (const paper of papers) {

    if(allowedConferences.length > 0 && !allowedConferences.includes(paper["Conference"]) || paper.Year < minYear || limit > 100) {
      continue;
    }

    firstYear = Math.min(firstYear, paper.Year);
    lastYear = Math.max(lastYear, paper.Year);
  }

  createVispubTimeslices(graph, firstYear, lastYear, agg);

  for (const paper of papers) {
      let coAuthors = [];


      if(allowedConferences.length > 0 && !allowedConferences.includes(paper["Conference"]) || paper.Year < minYear || limit > 100) {
        continue;
      }


       let authors = paper["AuthorNames-Deduped"].split(";");

      let affiliations = paper["AuthorAffiliation"].split(";");



      authors.forEach(function (author, i) {

        createVispubNode(graph, author, affiliations[i], paper.Year, agg);

        coAuthors.forEach(function (coAuthor) {
          createVispubLink(graph, author, coAuthor, paper.Year, agg);
        });

        coAuthors.push(author);

      });

  }

  graph.groups = groups;

  return graph;
}

function createVispubTimeslices(graph, minYear, maxYear, agg) {

  for(let year = minYear; year <= maxYear; year += agg) {
    let tag = year + " - " + (year+agg);
    graph.timeslices.push({displaytag: tag, tag: year - (minYear % agg), nodes: [], links: []})
  }

  graph.timeslices.reverse();

}

function createVispubNode(graph, author, affiliation, year, agg) {
  let diff = year % agg;
  year -= diff;


  let id = getNode(author, graph);
  if(id < 0) {
    id = idFactory.get('vispubNode');
  }

  if(!isNodeInYear(id, graph, year)) {
    if(!groups.has(affiliation)) {
      groups.set(affiliation, groups.size);
    }
    graph.timeslices[getTimeSliceId(graph, year)].nodes.push({name:author,group: groups.get(affiliation), id: id})
  }
}

function createVispubLink(graph, author, coAuthor, year, agg) {

    let diff = year % agg;
    year -= diff;

    let source = getNodeInYear(author, graph, year);
    let target = getNodeInYear(coAuthor, graph, year);

    let id = getLink(source, target, graph);
    if(id < 0) {
      id = idFactory.get('vispubLink');
    }

    if(!isLinkInYear(id, graph, year)) {
      graph.timeslices[getTimeSliceId(graph, year)].links.push({"source":source,"target":target,"value":1, "id": id})
    }


}
