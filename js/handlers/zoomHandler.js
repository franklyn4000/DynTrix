class ZoomHandler {
  zoom = null;
  tryZoomFit = false;
  zooming = false;
  transform = null;

  minZoom = 0.2;
  maxZoom = 4;
  padding = 0.72;

  constructor() {}

  setup() {
    let _this = this;
    let container = d3.select('#container');
    let svg = d3.select('svg');
    let zoomBtn = document.getElementById('zoomButton');

   /* zoomBtn.onclick = function () {
      _this.restart(120);
    };
*/
    this.zoom = d3.zoom()
      .scaleExtent([this.minZoom, this.maxZoom])
      .on("zoom", function ({transform}) {
        _this.transform = transform;
        container.attr("transform", transform);
      });

    svg.call(this.zoom);
  }

  restart(transitionDuration) {
    this.zoomFit(transitionDuration);
  }

  zoomFit(transitionDuration) {
    let _this = this;

    if (this.zooming) return;
    this.zooming = true;

    let container = d3.select('#container');
    let svg = d3.select('svg')

    let bounds = container.node().getBBox();
    let parent = container.node().parentElement;

    let fullWidth = parent.clientWidth,
      fullHeight = parent.clientHeight;
    let width = bounds.width,
      height = bounds.height;
    let midX = bounds.x + width / 2,
      midY = bounds.y + height / 2;
    if (width === 0 || height === 0) return; // nothing to fit

    let scale = this.padding * Math.min(fullWidth / width, fullHeight / height)

    let transform = d3.zoomIdentity
      .translate(-midX * scale, -midY * scale)
      .scale(scale);

    svg
      .transition()
      .duration(transitionDuration || 0) // milliseconds
      .call(_this.zoom.transform, transform)
      .on("end", function () {
        _this.zooming = false;
      });

  }

}
