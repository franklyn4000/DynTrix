async function parseVispub() {
  let graph = null;

  await d3.csv("data/infoVis2.csv")
    .then(function(data) {


      graph = parseGraph(data);

    })
    .catch(function(error){
      console.log(error);
    })


  return graph;
}

let groups = new Map();

function parseGraph(papers) {

  let graph = {};
  graph.timeslices = [];


  let firstYear = Number.MAX_VALUE;
  let lastYear = Number.MIN_VALUE;

  let allowedConferences =  ["Vis", "InfoVis", "VAST"];

  let limit = 0;

  const agg = 5;



  for (const paper of papers) {
      let coAuthors = [];


      if(!allowedConferences.includes(paper["Conference"]) || limit > 100) {
        continue;
      }

      firstYear = Math.min(firstYear, paper.Year);
      lastYear = Math.max(lastYear, paper.Year);

       let authors = paper["AuthorNames-Deduped"].split(";");

      let affiliations = paper["AuthorAffiliation"].split(";");

      authors.forEach(function (author, i) {

        createNode(graph, author, affiliations[i], paper.Year, agg);

        coAuthors.forEach(function (coAuthor) {
          createLink(graph, author, coAuthor, paper.Year, agg);
        });

        coAuthors.push(author);

      });

  }

  graph.groups = groups;

  return graph;
}


function createNode(graph, author, affiliation, year, agg) {

  let diff = year % agg;
  year -= diff;

  let tag = year + " - " + (year+agg);


  if(getTimeSliceId(graph, year) < 0) {
    graph.timeslices.push({displaytag: tag, tag: year, nodes: [], links: []})
  }

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

function createLink(graph, author, coAuthor, year, agg) {

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
