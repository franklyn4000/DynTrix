class DataController {
  data = null;

  constructor(callback) {
    let _this = this;

    const datasets = document.getElementById("datasets");
    datasets.addEventListener('change', async (e) => {
      await this.loadData(e.target.value, callback);
    });
    /*
        document.getElementById("files").addEventListener("click", function() {

          var reader = new FileReader();
          reader.addEventListener('load', function() {
            console.log(this.result);
          });
          reader.readAsText(document.getElementById("files").files[0]);

        });
        */
    /*
        const files = document.getElementById("files");
        files.addEventListener('change', (e) => {
          const file = files[0];
          const reader = new FileReader();
          reader.onload = (function () {
            return async function (e) {
              _this.data = _this.preProcessData(JSON.parse(e.target.result));
            };
          })(file);
          reader.readAsText(e.target.files[0]);
        });
*/
  }

  async loadData(dataName, callback) {

    document.getElementById("vis").classList.add("loading");
    document.getElementById("loader").classList.remove("notloading");

    switch (dataName) {
      case 'charriere':
        this.data = this.preProcessData(await parseCharriere());
        break;
      case 'dialog':
        this.data = this.preProcessData(await parseDialog());
        break;
      case 'mooc':
        this.data = this.preProcessData(await parseMooc());
        break;
      case 'rugby':
        this.data = this.preProcessData(await parseRugby());
        break;
      case 'infoVis':
        this.data = this.preProcessData(await parseInfoVis(false, false, 2010, 3));
        break;
      case 'infoVis1':
        this.data = this.preProcessData(await parseInfoVis(false, false, 2000, 1));
        break;
      case 'vispub0':
        this.data = this.preProcessData(await parseVispub(["Vis", "InfoVis", "VAST"], 2010, 3));
        break;
      case 'vispub0b':
        this.data = this.preProcessData(await parseVispub(["Vis", "InfoVis", "VAST"], 2005, 5));
        break;
      case 'vispub1':
        this.data = this.preProcessData(await parseVispub(["Vis", "InfoVis", "VAST"], 2000, 5));
        break;
      case 'vispub2':
        this.data = this.preProcessData(await parseVispub([], 0, 5));
        break;
      case 'vdBunt':
        this.data = this.preProcessData(await parseVdBunt());
        break;
      case 'infoVisPersistNodes':
        this.data = this.preProcessData(await parseInfoVis(true, false));
        break;
      case 'infoVisPersistNodesEdges':
        this.data = this.preProcessData(await parseInfoVis(true, true));
        break;
      case 'ramp':
        this.data = this.preProcessData(await parseRamp());
        break;
      case 'generated S':
        this.data = this.preProcessData(await parseGenerated("generated_small", 5));
        break;
      case 'generated M':
        this.data = this.preProcessData(await parseGenerated("generated_medium", 10));
        break;
      case 'generated L':
        this.data = this.preProcessData(await parseGenerated("generated_large", 20));
        break;
      case 'none':
      default:
        this.data = createEmptyGraph();
    }

    document.getElementById("vis").classList.remove("loading");
    document.getElementById("loader").classList.add("notloading");

    callback(this.data);



    return this;
  }

  get data() {
    return this.data;
  }

  preProcessData(rawData) {
    let _this = this;
    let data = {
      combinedGraph: {nodes: new Map(), links: new Map()},
      timeslices: [],
      colorToNode: new Map(),
      highestVolatility: 0
    }

    console.log(rawData)

    rawData.timeslices.forEach(function (rawSlice) {
      rawSlice.nodes.forEach(function (rawNode) {
        let visualNode = {id: rawNode.id, name: rawNode.name, hiddenColor: colorFactory.genColor(), links:[], volatility: 0}
        data.combinedGraph.nodes.set(rawNode.name, visualNode)
      });
      rawSlice.links.forEach(function (rawLink) {
        data.combinedGraph.links.set(rawLink.source + "-" + rawLink.target, rawLink)
      });
    });

    data.combinedGraph.nodes = Array.from(data.combinedGraph.nodes, ([name, value]) => (value));
    data.combinedGraph.links = Array.from(data.combinedGraph.links, ([name, value]) => (value));

    rawData.timeslices.forEach(function (rawSlice) {
      let newSlice = {displaytag: rawSlice.displaytag, tag: rawSlice.tag, nodes: [], links: [], matrices: [], nodes2: new Map(), links2: new Map()}
      rawSlice.nodes.forEach(function (rawNode) {
        let newNode = {id: rawNode.id, name: rawNode.name, group: rawNode.group, cluster: 0, clusterings: {}, visualNode: getNodeByName(data.combinedGraph.nodes, rawNode.name)}
        newSlice.nodes2.set(newNode.id, newNode);
      });
      rawSlice.links.forEach(function (rawLink) {
        let visualLink = getLinkBySourceTarget(data.combinedGraph.links, rawLink.source, rawLink.target)
        let newLink = {id: rawLink.id, source: rawLink.source, target: rawLink.target, visualLink: visualLink};
        newSlice.links2.set(newLink.source + "-" + newLink.target, newLink);
      });
      data.timeslices.push(newSlice);
    });

    data.combinedGraph.links.forEach(function (link) {
      data.combinedGraph.nodes.forEach(function (node) {
        if(!link.sourceNode && node.id === link.source) {
          link.sourceNode = node;
        }
        if(!link.targetNode && node.id === link.target) {
          link.targetNode = node;
        }
      });

    });

    data.combinedGraph.nodes.forEach(function (node) {
      data.colorToNode.set(node.hiddenColor, node);
      data.combinedGraph.links.forEach(function (link) {
        if(link.source === node.id || link.target === node.id) {
          node.links.push(link);
        }
      });
    });

    for(let i = 1; i < data.timeslices.length; i++) {
      let slice = data.timeslices[i];
      let prevSlice = data.timeslices[i - 1];
      data.combinedGraph.nodes.forEach(function (node){
        if(slice.nodes2.has(node.id) && !prevSlice.nodes2.has(node.id) || !slice.nodes2.has(node.id) && prevSlice.nodes2.has(node.id)) {
          node.volatility++;
          if(node.volatility > data.highestVolatility) {
            data.highestVolatility = node.volatility;
          }
        }
      });
    }

    data.groups = rawData.groups;

    console.log(data)
    return data;
  }



}

