class DragHandler {
    simulation = null;
    handler = null;

    constructor() {}

    setup(simulation) {
        this.simulation = simulation;
        /*
        this.handler = d3.drag()
            .on("start", (e, d) => this.drag_start(e, d))
            .on("drag", (e, d) => this.drag_drag(e, d))
            .on("end", (e, d) => this.drag_end(e, d));*/
    }

    setNodes(nodes) {
        this.handler(nodes);
    }

    drag_start(e, d) {
        if (!e.active) this.simulation.alphaTarget(0.2).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    drag_drag(e, d) {
        d.fx = e.x;
        d.fy = e.y;
    }

    drag_end(e, d) {
        if (!e.active) this.simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
}
