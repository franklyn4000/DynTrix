async function parseDialog() {
  let graph = null;



  graph = await readDialogfiles();



  return graph;
}

async function readDialogfiles() {


  let files = [];

  for (let i = 1; i < 3; i++) {
    let index = i;
    if(i < 10){
      index = "0" + i;
    }
    files.push(await readTSVFile("data/dialog/chapter_" + index + ".txt"))
    console.log(index);
  }

 // let dataset = new DialogDataset();

  let dataset = parseDialogs(files);

  console.log(dataset)

  let graph = parseDialogGraph(files, 1, null);

  return graph;
}


const FIXED_DURATION = 1;
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
 /* DyGraph graph = new DyGraph();
  DyNodeAttribute<Boolean> presence = graph.nodeAttribute(StdAttribute.dyPresence);
  DyNodeAttribute<String> label = graph.nodeAttribute(StdAttribute.label);
  DyNodeAttribute<Coordinates> position = graph.nodeAttribute(StdAttribute.nodePosition);
  DyNodeAttribute<Color> color = graph.nodeAttribute(StdAttribute.color);
  DyEdgeAttribute<Boolean> edgePresence = graph.edgeAttribute(StdAttribute.dyPresence);
  DyEdgeAttribute<Color> edgeColor = graph.edgeAttribute(StdAttribute.color);

//		DialogDataset dataset = parseDialogs(new ZipInputStream(inputDir));
  Map<String, Node> nodeMap = new HashMap<>();
  for (String character : dataset.characters) {
    Node node = graph.newNode(character);
    presence.set(node, new Evolution<>(false));
    label.set(node, new Evolution<>(character));
    position.set(node, new Evolution<>(new Coordinates(0, 0)));
    color.set(node, new Evolution<>(new Color(141, 211, 199)));
    nodeMap.put(character, node);
  }

  for (Dialog dialog : dataset.dialogs) {
    Node source = nodeMap.get(dialog.source);
    Node target = nodeMap.get(dialog.target);
    Edge edge = graph.betweenEdge(source, target);
    if (edge == null) {
      edge = graph.newEdge(source, target);
      edgePresence.set(edge, new Evolution<>(false));
      edgeColor.set(edge, new Evolution<>(Color.BLACK));
    }

    Interval participantPresence = Interval.newRightClosed(
      dialog.time - dialogDuration * dialog.nominalDuration * 10.0,
      dialog.time + dialogDuration * dialog.nominalDuration * 11.0);
    Interval dialogInterval = Interval.newRightClosed(
      dialog.time,
      dialog.time + dialogDuration * dialog.nominalDuration);

    presence.get(source).insert(new FunctionConst<>(participantPresence, true));
    presence.get(target).insert(new FunctionConst<>(participantPresence, true));
    edgePresence.get(edge).insert(new FunctionConst<>(dialogInterval, true));
  }

  Commons.scatterNodes(graph, 200);
  Commons.mergeAndColor(graph, dataset.startTime, dataset.endTime + 1, mode, new Color(141, 211, 199), Color.BLACK, 0.001);
  return graph;*/
}

function parseDialogs(files) {
  let dataset = new DialogDataset();

  console.log(files)

  files.forEach(function (file) {
    console.log(file)

    let fileLines = [];


    for (const [key, value] of Object.entries(file)) {

      console.log(Object.values(value)[0], Object.values(value)[1])
    }

  });

/*
  ZipEntry zie = inputStream.getNextEntry();
  while(zie != null) {
    //			System.out.print("\rLoading file " + zie.getName());
    //			for (File fileEntry : inputStream.getNextEntry()) {
    //				if (fileEntry.getName().toLowerCase().endsWith(".txt")) {
    List<String> fileLines = ParserTools.readFileLinesFromStream(
      new FilterInputStream(inputStream) {
      public void close() throws IOException {
        inputStream.closeEntry();
      }
    }
  );



    List<Dialog> fileDialogs = new ArrayList<>();
    for (String line : fileLines) {
      if (line.contains("\t")) {
        String[] tokens = line.split("\t");
        assert (tokens.length == 2) : "Line not breakable on tab for file: " + zie.getName();
        Dialog dialog = new Dialog();
        dialog.source = tokens[0];
        dialog.target = tokens[1];
        dataset.characters.add(tokens[0]);
        dataset.characters.add(tokens[1]);
        fileDialogs.add(dialog);
      }
    }
    int chapter = Integer.parseInt(zie.getName().replaceAll("[\\D]", ""));
    dataset.startTime = Math.min(dataset.startTime, chapter);
    dataset.endTime = Math.max(dataset.endTime, chapter + 1);
    double order = 0;
    for (Dialog dialog : fileDialogs) {
      dialog.nominalDuration = 1.0 / fileDialogs.size();
      dialog.time = chapter + order * dialog.nominalDuration;
      dataset.dialogs.add(dialog);
      order++;
    }
    //inputStream.closeEntry();
    zie = inputStream.getNextEntry();
    //				}
    //}
  }
  //System.out.println("\nLoading complete");
  return dataset;*/
}
