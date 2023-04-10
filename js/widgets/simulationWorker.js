let d3 = import('../../lib/d3.min.js');

this.initialized = false;

onmessage = (e) => {
  console.log('Web worker started with data: ', e);
  if(!initialized) {
    self.postMessage({'do':'test'});

    this.data = e.data.data;
    this.timeSlice = e.data.timeSlice;


    this.simulation = d3.forceSimulation()
      .velocityDecay(0.56)
      .force("charge", d3.forceManyBody().strength(d => d.charge).distanceMin(13).theta(1.2))

      .force("link", d3.forceLink().id(d => d.id).distance(d => d.distance).strength(d => d.strength))
      .force('center', d3.forceCenter(this.w / 2, this.h / 2))
      .force('forceX', d3.forceX().x(this.w * 0.5))
      .force('forceY', d3.forceY().y(this.h * 0.5))
      .force('collide', d3.forceCollide().radius(d => d.radius));


    this.data = data;
    this.logicalGraph = data.timeslices[timeSlice];
    this.visualGraph = this.data.combinedGraph;

    window.requestAnimationFrame(this.step.bind(this));

  }


}

function initialize() {

}
