class Matrix {
  clusters = [];
  orderStore = null
  cfg = null;
  svg = null;
  ordering = null;

  reorderingController = null;

  context = null;
  hiddenContext = null;
  transform = null;
  links = [];
  labels = new Map();
  hoverNodes = {rowNode:null, columnNode:null};
  tempNode = null;

  highlightNewEdge = false;
  highlightLeavingEdge = false;
  highlightNew = false;
  highlightLeaving = false;
  leavingNodes = [];

  constructor(svg, cfg, tempNode) {
    this.svg = svg;
    this.cfg = cfg;
    this.tempNode = tempNode;
  }

  setup(data, links, labels, ordering, clusters, reorderingController, context, hiddenContext, transform) {
    this.clusters = clusters;
    this.submatrix = data;
    this.links = links;
    this.reorderingController = reorderingController;
    this.context = context;
    this.hiddenContext = hiddenContext;
    this.transform = transform;
    this.orderStore = new OrderStore();
    this.ordering = ordering;

   // this.setOrdering(ordering, null);
  }


  setTimeslice(leavingNodes, leavingBridges, logicalGraph) {
    let _this = this;
    this.leavingNodes = leavingNodes;

    this.submatrix.forEach(function (row) {
      row.forEach(function (subCell) {
        subCell.greyed = leavingNodes.indexOf(subCell.n1.id) > -1 || leavingNodes.indexOf(subCell.n2.id) > -1;
        if(subCell.greyed) {
          subCell.color = undefined;
        }
        subCell.z = 0;
      });
    });

 //   console.log(logicalGraph.links2)

    logicalGraph.links2.forEach(function (link) {


      let cell = getMatrixCellsByLinkId(_this.submatrix, link.source, link.target)
      if(cell) {
        cell.n2.z = 1;
        cell.n1.z = 1;
        cell.link = link;
        cell.asda= "asd";
      }
    });

    _this.update(false, null);

  }

  update(reorder, transform) {
    let _this = this;

    if(!transform) {
      transform = this.transform;
    } else {
      this.transform = transform;
    }

    this.scale = d3.scaleBand().range([0, this.cfg.matrix.cellSize * this.submatrix.length]);
    this.scale.domain(this.orderStore.order);

    let oldScale = this.scale;
    if(reorder) {
      if (this.orderStore.oldOrder) {
        oldScale = d3.scaleBand().range([0, this.cfg.matrix.cellSize * this.submatrix.length]);
        oldScale.domain(this.orderStore.oldOrder);
      }
    }

    this.cells = [];

    this.submatrix.forEach(function (row, i) {
      let rowY = _this.orderStore.oldOrder ? oldScale(i) : _this.scale(i);



      _this.submatrix[i][i].node.nodeIndex = rowY / _this.cfg.matrix.cellSize;

      row.forEach(function (subCell, j) {
        let cell = {};

        cell.x = _this.orderStore.oldOrder ? oldScale(j) : _this.scale(j);
        cell.y = rowY;

        cell.hiddenColor = subCell.hiddenColor;

        if(_this.isHoveringSubCell(subCell)) {
          cell.strokeColor = _this.cfg.general.hoverColor;
        } else {
          cell.strokeColor = "rgba(0, 0, 0, 1)";
        }

        if(subCell.greyed) {
          cell.color = "#ddd";
        } else if (i === j) {

          if(!_this.isHoveringSubCell(subCell)) {
            cell.color = _this.clusters[subCell.node.cluster].color;
          } else {
            cell.color = pSBC(0.3, _this.clusters[subCell.node.cluster].color);
          }
        } else {
          let c = _this.cfg.matrix.cellColor;
          if(subCell.z) {

            let link = getLinkFromMapBySourceTarget(subCell.parent.subgraph.links, subCell.n1, subCell.n2)[1];
            if(link.willGo && _this.highlightLeavingEdge) {
              c = pSBC(0.3, _this.cfg.matrix.cellColorLink);
            } else if(link.isNew && _this.highlightNewEdge) {
              c = pSBC(0.3, _this.cfg.matrix.cellColorLink);
            } else {
              c = _this.cfg.matrix.cellColorLink;
            }
          }

          if(!_this.isHoveringSubCell(subCell)) {
            cell.color = c;
          } else {
            cell.color = pSBC(-0.3, c);
          }
        }
        //ell.color = subCell.hiddenColor;

        if(subCell.node && subCell.node.selected || subCell.n1 && subCell.n1.selected || subCell.n2 && subCell.n2.selected) {
          cell.strokeColor = _this.cfg.general.selectionColor;
          cell.color = _this.cfg.general.selectionColor2;
        }

        if(i === j) {
          _this.submatrix[i][j].labelColor = cell.strokeColor;
        }

        _this.cells.push(cell);
      });

    });


    /*
    this.svg.selectAll(".cell").remove();
    this.svg.selectAll(".row").remove();
    this.svg.selectAll(".column").remove();


    this.rows = this.svg.selectAll(".row").data(this.submatrix).enter()
      .append("g")
      .attr("class", "row")
      .attr("transform", function (d, i) {
        return _this.orderStore.oldOrder ? "translate(" + 0 + "," + oldScale(i) + ")" : "translate(" + 0 + "," + _this.scale(i) + ")"
      })
      .transition()
      .delay(function (d, i) {
        return i * _this.cfg.matrix.transitionDelay;
      })
      .duration(_this.cfg.matrix.transitionDuration)
      .attr("transform", function (d, i) {
        return "translate(" + 0 + "," + _this.scale(i) + ")";
      })
      .each(function (row) {
        _this.cells.push(d3.select(this)
          .selectAll(".cell")
          .data(row)
          .enter().append("rect").attr("class", "cell")
          .attr("width", _this.scale.bandwidth())
          .attr("height", _this.scale.bandwidth())
        );
      });

    this.svg.selectAll(".cell")
      .attr("transform", function (d, i) {
        return _this.orderStore.oldOrder ? "translate(" + oldScale(d.x) + "," + 0 + ")" : "translate(" + _this.scale(d.x) + "," + 0 + ")"
      })
      .transition()
      .delay(function (d, i) {
        return d.x * _this.cfg.matrix.transitionDelay;
      })
      .duration(_this.cfg.matrix.transitionDuration)
      .attr("transform", function (d, i) {
        return "translate(" + _this.scale(d.x) + "," + 0 + ")";
      })

    this.svg.selectAll('.cell-label').remove();
    this.cellLabels = this.svg.selectAll(".cell-label")
      .data(this.labels).enter()
      .append('g')
      .attr("class", "cell-label");

    this.cellLabels.append("text")
      .text(function (d, i) {
        return d;
      })
      .attr("text-anchor", "start")
      .attr("alignment-baseline", "hanging")
      .attr("dx", function (d) {
        return _this.scale.bandwidth() * _this.submatrix.length + _this.cfg.matrix.cellSize / 4;
      })
      .attr("class", "cell-label").attr("transform", function (d, i) {
      return _this.orderStore.oldOrder ? "translate(" + 0 + "," + (oldScale(i) + 2) + ")" : "translate(" + 0 + "," + _this.scale(i) + ")"
    })
      .transition()
      .delay(function (d, i) {
        return i * _this.cfg.matrix.transitionDelay;
      })
      .duration(_this.cfg.matrix.transitionDuration)
      .attr("class", "cell-label").attr("transform", function (d, i) {
      return "translate(" + 0 + "," + (_this.scale(i) + 2) + ")";
    })
      .attr("class", "label");

    this.svg.selectAll(".column").data(this.submatrix).enter()
      .append("g")
      .attr("class", "column")
      .attr("transform", function (d, i) {
        return "translate(" + (_this.scale(i)) + "," + (0) + ")rotate(-90)";
      });


     */

    _this.submatrix.forEach(function (d, i) {
      let rowY = _this.orderStore.oldOrder ? oldScale(i) : _this.scale(i);
      let label = {};


      if(_this.ordering === "Volatility-Based") {
        label.name = padString(_this.submatrix[i][i].volatility, 2) + " " + _this.submatrix[i][i].node.name;
      } else {
        label.name = _this.submatrix[i][i].node.name;
      }

      label.color = _this.submatrix[i][i].labelColor;
      label.node = _this.submatrix[i][i].node;

      _this.labels.set(_this.submatrix[i][i].node.id, label);
      _this.labels.get(_this.submatrix[i][i].node.id).x = _this.cfg.matrix.cellSize * _this.submatrix.length;
      _this.labels.get(_this.submatrix[i][i].node.id).y = rowY + _this.cfg.matrix.cellSize;
    });



    this.draw(transform);
  }

  isHoveringSubCell(subCell) {
    return this.hoverNodes.rowNode && this.hoverNodes.columnNode && (subCell.n1.id === this.hoverNodes.rowNode.id || subCell.n2.id === this.hoverNodes.columnNode.id);
  }

  hover(rowNode, columnNode) {
    this.hoverNodes.rowNode = rowNode;
    this.hoverNodes.columnNode = columnNode;

    this.update(false, null);
  }


  hoverNode(node) {
    this.hoverNodes.rowNode = node;
    this.hoverNodes.columnNode = node;
    this.update(false, null);
  }


  unhover() {
    this.hoverNodes.rowNode = null;
    this.hoverNodes.columnNode = null;

    this.update(false, null);
  }

  hiddenDraw(transform, xPos, yPos) {
    let _this = this;

    let xCenter = xPos - this.submatrix.length * _this.cfg.matrix.cellSize / 2;
    let yCenter = yPos - this.submatrix.length * _this.cfg.matrix.cellSize / 2;

    this.hiddenContext.save();
    this.hiddenContext.translate(transform.x, transform.y);
    this.hiddenContext.scale(transform.k, transform.k);
    this.cells.forEach(function (cell) {
      _this.hiddenContext.beginPath();
      _this.hiddenContext.rect(cell.x + xCenter, cell.y + yCenter, _this.cfg.matrix.cellSize, _this.cfg.matrix.cellSize);
      _this.hiddenContext.fillStyle = cell.hiddenColor;
      _this.hiddenContext.strokeStyle = cell.hiddenColor;
      _this.hiddenContext.fill();
    });
    this.context.restore();

    _this.context.beginPath();
    _this.context.rect(
      xCenter + (this.submatrix.length + 2) * _this.cfg.matrix.cellSize - _this.cfg.matrix.buttonSize / 2 - _this.cfg.matrix.cellSize,
      yCenter - _this.cfg.matrix.cellSize * 2 - _this.cfg.matrix.buttonSize / 2 + _this.cfg.matrix.cellSize,
      _this.cfg.matrix.buttonSize,
      _this.cfg.matrix.buttonSize);
    _this.context.fillStyle = this.submatrix[0][0].parent.deleteHiddenColor;
    _this.context.fill();
    this.context.restore();

  }

  draw(transform, xPos, yPos, circlingAngle) {
    let _this = this;

    if(!circlingAngle) {
      circlingAngle = 0;
    }

    let xCenter = xPos - this.submatrix.length * _this.cfg.matrix.cellSize / 2;
    let yCenter = yPos - this.submatrix.length * _this.cfg.matrix.cellSize / 2;

    this.context.save();
    this.context.translate(transform.x, transform.y);
    this.context.scale(transform.k, transform.k);
    this.cells.forEach(function (cell) {
      _this.context.beginPath();
      _this.context.rect(cell.x + xCenter, cell.y + yCenter, _this.cfg.matrix.cellSize, _this.cfg.matrix.cellSize);
      _this.context.fillStyle = cell.color;
      _this.hiddenContext.strokeStyle = cell.strokeColor;
      _this.context.fill();
      _this.context.stroke();

    });
    this.context.restore();

    this.context.save();
    this.context.translate(transform.x, transform.y);
    this.context.scale(transform.k, transform.k);

   _this.context.beginPath();
   _this.context.rect(
     xCenter + (this.submatrix.length + 2) * _this.cfg.matrix.cellSize - _this.cfg.matrix.buttonSize / 2 - _this.cfg.matrix.cellSize,
     yCenter - _this.cfg.matrix.cellSize * 2 - _this.cfg.matrix.buttonSize / 2 + _this.cfg.matrix.cellSize,
     _this.cfg.matrix.buttonSize,
     _this.cfg.matrix.buttonSize);
   _this.context.fillStyle = _this.cfg.general.subtlerColor;
   _this.hiddenContext.strokeStyle = "#888";
   _this.context.fill();
   _this.context.stroke();
   this.context.restore();

   this.context.save();
   this.context.translate(transform.x, transform.y);
   this.context.scale(transform.k, transform.k);
   _this.context.font = "22px Arial";
   _this.context.fillStyle = "#655";
   _this.context.fillText("X",
     xCenter + (this.submatrix.length + 2) * _this.cfg.matrix.cellSize - _this.cfg.matrix.buttonSize / 2 - _this.cfg.matrix.cellSize + 4,
     yCenter - _this.cfg.matrix.cellSize * 2 + _this.cfg.matrix.cellSize + 8);
   this.context.restore();

    this.context.save();
    this.context.translate(transform.x, transform.y);
    this.context.scale(transform.k, transform.k);
    this.links.forEach(function (link) {
      _this.context.beginPath();
      _this.drawBridge(link);
      _this.context.strokeStyle = '#000000';
      _this.context.lineWidth = 1;

      if((link.isNew && _this.highlightNewEdge) || (link.willGo && _this.highlightLeavingEdge))
        _this.context.lineWidth = 4;

      _this.context.stroke();
    });
    this.context.restore();

    this.context.save();
    this.context.translate(transform.x, transform.y);
    this.context.scale(transform.k, transform.k);
    this.labels.forEach(function (label) {
      _this.drawLabel(label, xCenter, yCenter, circlingAngle);
    });
    this.context.restore();
  }

  calculateCircling(x, y, node, highlightNew, highlightLeaving, circlingAngle) {
    let _this = this;
    let circlingRadius = _this.cfg.node.circlingRadius;
    y = 0;
    let nodeX = x;
    let nodeY = y;
    if (this.leavingNodes.indexOf(node.id) < 0 && node.isNew && this.highlightNew) {
      nodeX = x + Math.cos(circlingAngle) * circlingRadius;
      nodeY = y + Math.sin(circlingAngle) * circlingRadius;
    } else if (this.leavingNodes.indexOf(node.id) < 0 && node.willGo && this.highlightLeaving) {
      nodeX = x + Math.cos(-1 * circlingAngle) * circlingRadius;
      nodeY = y + Math.sin(-1 * circlingAngle) * circlingRadius;
    }
    return {x: nodeX, y: nodeY};
  }

  drawLabel(label, x, y, circlingAngle) {
    let coords = this.calculateCircling(x, y, label.node, this.highlightNew, this.highlightLeaving, circlingAngle)
    let xCenter = x;
    let yCenter = y;
    let _this = this;

    _this.context.font = _this.cfg.matrix.cellSize + "px Consolas";
    _this.context.fillStyle = label.color;
    _this.context.fillText(label.name, label.x + coords.x + _this.cfg.matrix.cellSize/4, label.y + yCenter - 2);
    _this.context.translate(label.y + xCenter - _this.cfg.matrix.cellSize + 2, label.x + yCenter + _this.cfg.matrix.cellSize/4);
    _this.context.rotate((90 * Math.PI) / 180);
    _this.context.fillText(label.name, coords.y, 0);
    _this.context.rotate(-(90 * Math.PI) / 180);
    _this.context.translate(-(label.y + xCenter - _this.cfg.matrix.cellSize + 2), -(label.x + yCenter + _this.cfg.matrix.cellSize/4));

  }

  drawBridge(link) {
    let _this = this;



    if (link.invisible ||
      !link.sourceNode.x ||
      !link.targetNode.x ||
      !link.sourceNode.y ||
      !link.targetNode.y
    ) {
      return;
    }


    let sourceAnchor = {x: link.sourceNode.x, y: link.sourceNode.y};
    let sourcePivot = {x: link.sourceNode.x, y: link.sourceNode.y};
    let targetAnchor = {x: link.targetNode.x, y: link.targetNode.y};
    let targetPivot = {x: link.targetNode.x, y: link.targetNode.y};





    let theta = calculateTheta(link.sourceNode, link.targetNode);

    if ('subgraph' in link.sourceNode) {
      if(!link.sourceNode.matrix) return;
      let index = link.originalSource.nodeIndex;

      updateAnchor(link.sourceNode, index, theta, _this.cfg.matrix.margin, sourceAnchor, sourcePivot);
    }
    if ('subgraph' in link.targetNode) {
      if(!link.targetNode.matrix) return;
     // let index = link.targetNode.matrix.scale.domain().indexOf(nodeIndexOf(link.targetNode.subgraph.nodes, link.originalTarget));
      let index = link.originalTarget.nodeIndex;
      updateAnchor(link.targetNode, index, (theta + 180) % 360, _this.cfg.matrix.margin, targetAnchor, targetPivot);
    }

    this.drawBezier(sourceAnchor.x, sourceAnchor.y, sourcePivot.x, sourcePivot.y, targetPivot.x, targetPivot.y, targetAnchor.x, targetAnchor.y);
  }

  drawBezier(x0, y0, x1, y1, x2, y2, x3, y3) {
    this.context.moveTo(x0, y0)
    this.context.bezierCurveTo(x1, y1, x2, y2, x3, y3);
  }

  setOrdering(ordering, graph) {
    this.ordering = ordering;
    this.orderStore.order = (this.reorderingController.getOrdering(ordering, this.submatrix, graph));
    this.update(true, null);

  }

}
