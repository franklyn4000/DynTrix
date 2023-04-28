async function parseCharriere() {
  let graph = await readCharrierefiles();

  return graph;
}


async function readCharrierefiles() {
  let files = [];


  files.push(await readCSVFile("data/charriere/merged_people_file"));
  files.push(await readCSVFile("data/charriere/merged_letters_file"));
  files.push(await readCSVFile("data/charriere/letter_to_people_file"));


  let graph = parseCharriereGraph(files, 1);

  return graph;
}

function parseCharriereGraph(dataset, duration) {




}
