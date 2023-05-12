async function parseVdBunt() {
  let graph = null;


  graph = await readVDBfiles();



  return graph;
}

async function readVDBfiles() {


  let files = [];

  files.push(await readFile("data/vdBunt/VARS.DAT"))

  for (let i = 0; i < 7; i++) {
    files.push(await readFile("data/vdBunt/VRND32T" + i + ".DAT"))
  }

  let vdb = new VanDeBunt();

  let graph = vdb.parse(null, files);

  return graph;
}


async function readFile(file) {
  let f;
  await d3.csv(file)
    .then(function (data) {
      f = data;
    })
    .catch(function (error) {
      console.log(error);
    })

  return f;
}

async function readTSVFile(file) {
  let f;
  await d3.tsv(file)
    .then(function (data) {
      f = data;
    })
    .catch(function (error) {
      console.log(error);
    })

  return f;
}

class VanDeBunt {

  parse(mode, files)  {
    let _this = this;

    let dataset = this.parseRelations(files);

    let graph = {};
    graph.timeslices = [];

    for(let i = 0; i < dataset.relations.length; i++) {

      let timeslice = {tag: i, nodes: [], links: []};
      graph.timeslices.push(timeslice)

      for(let row = 0; row < dataset.relations[i].length; row++) {

        let newNode = {name: dataset.students[row].label , group: dataset.students[row].programme, id: row};
        timeslice.nodes.push(newNode);

        for(let col = row + 1; col < dataset.relations[i][row].length; col++) {
          console.log(row, col, dataset.relations[i][row][col])

          if(dataset.relations[i][row][col] !== 0 || dataset.relations[i][col][row] !== 0) {
            let matrixSize = dataset.relations[i].length;
            let link = {source:row,target:col,value:1, id: i * matrixSize * matrixSize + col * matrixSize + row};
            timeslice.links.push(link);
          }
        }

      }

    }
/*
    dataset.relations.forEach(function (relLine, i) {



      let timeslice = {tag: i, nodes: [], links: []};

      for(let n = 0; n < relLine.length - i; i++) {
        console.log(relLine[n])
      }



      relLine.forEach(function (node, n) {

        let newNode = {name: dataset.students[n].label , group: dataset.students[n].programme, id: n};

        timeslice.nodes.push(newNode);

       // console.log(node)

        node.forEach(function (rel, j) {

          console.log()
          if(rel !== 0 && !_this.isLinkInTimeslice(j, n, timeslice)  && !_this.isLinkInTimeslice(n, j, timeslice)) {
            let link = {source:n,target:j,value:rel, id: j * dataset.relations.length + n};
            timeslice.links.push(link);
          }

        });

      });






      graph.timeslices.push(timeslice)

    });
*/


    console.log(graph)

    return graph;
  }


  isLinkInTimeslice(source, target, slice) {
    let linkId = -1;
    slice.links.forEach(function (link, i) {
      if (link.source === source && link.target === target || link.target === source && link.source === target) {
        linkId = link.id;
      }
    });

    return linkId >= 0;
  }

  parseRelations(files) {
    let dataset = new RelationDataset();

    let fileMap = files[0];
    let fileLines = [];

    for (const [key, value] of Object.entries(fileMap)) {
      fileLines.push(value[" values"]);
    }

    fileLines.splice(fileLines.length-1, 1)

    fileLines.forEach(function (line, i) {
      let student = new Student();
      dataset.students.push(student);
      let tokens = line.trim().split(/\s+/);
      student.label = dataset.students.length;
      student.male = tokens[0] === "1";
      student.programme = parseInt(tokens[1]);
      student.smoker = tokens[2] === "1";
    });


    for (let i = 1; i < files.length; i++) {
      let sliceNumber = i-1;
      while (dataset.relations.length <= sliceNumber) {
        dataset.relations.push(null);
      }
      let sliceRelations = [];
      let lineNumber = 0;
      let columnNumber = 0;

      let fileMap = files[i];
      let fileLines = [];


      for (const [key, value] of Object.entries(fileMap)) {
        fileLines.push(value[" values"]);
      }


      fileLines.splice(fileLines.length-1, 1)
      fileLines.forEach(function (line) {
        let tokens = line.trim().split(/\s+/);

        sliceRelations[lineNumber] = [];
        tokens.forEach(function (token, i) {
          let value = parseInt(token);
         // let correctedValue = value >= RelationType.values().length ? 0 : value;

          let correctedValue = value >= 3 ? 0 : value;

          sliceRelations[lineNumber][columnNumber] = correctedValue;
          columnNumber++;

        });
        lineNumber++;
        columnNumber = 0;

      });
      dataset.relations[sliceNumber] = sliceRelations;


    }

    return dataset;
}

//System.out.println("\nLoading complete");

//return dataset;
//}


}

class RelationDataset {
  students = [];
  relations = [];
}

class Student {
  label;
  male;
  smoker;
  programme;
}

class RelationType {
  unknown = 0;
  bestFriend =  4;
  friend =  3;
  aquaintance = 2;
  random = 1;
  dislike = -1;
  betterScale = 0;

  RelationType(betterScale) {
    this.betterScale = betterScale;
  }
}
