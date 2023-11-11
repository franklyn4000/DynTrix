let nodetrix;
let config;


document.addEventListener('DOMContentLoaded', async function() {
  let configController = new ConfigController();
  await configController.loadConfig('cfg/config.json');
  config = configController.config;

  let dataController = new DataController(createNodeTrix);
  await dataController.loadData('generated S', createNodeTrix);
});

function createNodeTrix(data) {
  console.log(nodetrix)
  if(nodetrix) {
    nodetrix.destroy();
  }
  let clusteringView = new ClusteringView();
  clusteringView.setupClusterings(['None', 'Labels', 'Louvain']);
  let clusteringController = new ClusteringController();
  clusteringController.preComputeAllClusterings(data)
  let reorderingView = new ReorderingView();
  reorderingView.setupReorderings(['None', 'Spectral', 'Barycenter', "Optimal Leaf Ordering", "Reverse Cuthill-McKee", "Volatility-Based"]);
  let reorderingController = new ReorderingController();
  let clustersView = new ClustersView();
  let timelineView = new TimelineView();

  nodetrix = new NodeTrix(1000, 1000, config)
  .setClusteringView(clusteringView)
  .setClusteringController(clusteringController)
  .setReorderingView(reorderingView)
  .setReorderingController(reorderingController)
  .setClustersView(clustersView)
  .setTimelineView(timelineView)
  .setup(data, 0);

}
