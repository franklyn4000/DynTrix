class Matrix {
  clusters = [];
  orderStore = null
  cfg = null;
  svg = null;

  reorderingController = null;

  context = null;
  hiddenContext = null;
  transform = null;
  links = [];
  labels = new Map();
  hoverNodes = {rowNode:null, columnNode:null};
  tempNode = null;

  constructor(svg, cfg, tempNode) {
    this.svg = svg;
    this.cfg = cfg;
    this.tempNode = tempNode;
  }

  setup(data, links, labels, ordering, clusters, reorderingController, context, hiddenContext, transform) {
    let _this = this;

    this.clusters = clusters;
    this.submatrix = data;
    this.links = links;
    this.reorderingController = reorderingController;
    this.context = context;
    this.hiddenContext = hiddenContext;
    this.transform = transform;


    this.orderStore = new OrderStore();

    this.setOrdering(ordering, null);
 //   this.update(false, transform);
  }


  setTimeslice(leavingNodes, logicalGraph) {
    let _this = this;

    this.submatrix.forEach(function (row, i) {
      row.forEach(function (subCell, j) {
        subCell.greyed = leavingNodes.indexOf(subCell.n1.id) > -1 || leavingNodes.indexOf(subCell.n2.id) > -1;
        if(subCell.greyed) {
          subCell.color = undefined;
        }
        subCell.z = 0;
      });
    });

    logicalGraph.links2.forEach(function (link) {
      let cell = getMatrixCellsByLinkId(_this.submatrix, link.source, link.target)
      if(cell) {
        cell.n2.z = 1;
        cell.n1.z = 1;
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
          if(!_this.isHoveringSubCell(subCell)) {
            cell.color = subCell.z ? _this.cfg.matrix.cellColorLink : _this.cfg.matrix.cellColor;
          } else {
            cell.color = pSBC(-0.3, subCell.z ? _this.cfg.matrix.cellColorLink : _this.cfg.matrix.cellColor);
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


      label.name = _this.submatrix[i][i].node.name;
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

    let margin = 1;


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

    let buttonSize = 28;
    _this.context.beginPath();
    _this.context.rect(xCenter + (this.submatrix.length + 2) * _this.cfg.matrix.cellSize - buttonSize / 2, yCenter - _this.cfg.matrix.cellSize * 2 - buttonSize / 2, buttonSize, buttonSize);
    _this.context.fillStyle = this.submatrix[0][0].parent.deleteHiddenColor;
    _this.context.fill();
    this.context.restore();

  }

  draw(transform, xPos, yPos) {
    let _this = this;

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

    let buttonSize = 28;
    _this.context.beginPath();
    _this.context.rect(xCenter + (this.submatrix.length + 2) * _this.cfg.matrix.cellSize - buttonSize / 2, yCenter - _this.cfg.matrix.cellSize * 2 - buttonSize / 2, buttonSize, buttonSize);
    _this.context.fillStyle = _this.cfg.general.secondaryColor;
    _this.hiddenContext.strokeStyle = "#555";
    _this.context.fill();
    _this.context.stroke();
    this.context.restore();

    this.context.save();
    this.context.translate(transform.x, transform.y);
    this.context.scale(transform.k, transform.k);
    _this.context.font = "20px Arial";
    _this.context.fillStyle = "#333";
    _this.context.fillText("X", xCenter + (this.submatrix.length + 2) * _this.cfg.matrix.cellSize - buttonSize / 2 + 7, yCenter - _this.cfg.matrix.cellSize * 2 + 8);
    this.context.restore();


    this.context.save();
    this.context.translate(transform.x, transform.y);
    this.context.scale(transform.k, transform.k);
    this.links.forEach(function (link) {
      _this.context.beginPath();
      _this.drawBridge(link);
      _this.context.strokeStyle = '#000000';
      _this.context.lineWidth = 1;
      _this.context.stroke();
    });
    this.context.restore();

    this.context.save();
    this.context.translate(transform.x, transform.y);
    this.context.scale(transform.k, transform.k);
    this.labels.forEach(function (label) {

      _this.context.font = _this.cfg.matrix.cellSize + "px Arial";
      _this.context.fillStyle = label.color;
      _this.context.fillText(label.name, label.x + xCenter + _this.cfg.matrix.cellSize/4, label.y + yCenter - 2);
      _this.context.translate(label.y + xCenter - _this.cfg.matrix.cellSize + 2, label.x + yCenter + _this.cfg.matrix.cellSize/4);
      _this.context.rotate((90 * Math.PI) / 180);
      _this.context.fillText(label.name, 0, 0);
      _this.context.rotate(-(90 * Math.PI) / 180);
      _this.context.translate(-(label.y + xCenter - _this.cfg.matrix.cellSize + 2), -(label.x + yCenter + _this.cfg.matrix.cellSize/4));
    });
    this.context.restore();


    /*
    let clusters = this.clusters;

    this.cells.forEach(function (cell) {
      cell.style("stroke", function (d) {
        if ("node" in d && d.node.highlighted) {
          return "#eee";
        }
        return _this.cfg.matrix.cellStroke;
      })
        .style("stroke-width", _this.cfg.matrix.cellStrokeWidth)
        .style("opacity", 1)
        .style("fill", function (d) {
          if (d.x === d.y) {
            return clusters[d.node.cluster].color;
          }
          return d.z ? _this.cfg.matrix.cellColorLink : _this.cfg.matrix.cellColor;
        });
    });



        d3.selectAll(".bridge").attr("d", function (d) {

          if (d.invisible || !d.sourceNode.xPos || !d.targetNode.xPos || !d.sourceNode.yPos || !d.targetNode.yPos) {
            return;
          }

          let sourceAnchor = {x: d.sourceNode.xPos, y: d.sourceNode.yPos};
          let sourcePivot = {x: d.sourceNode.xPos, y: d.sourceNode.yPos};
          let targetAnchor = {x: d.targetNode.xPos, y: d.targetNode.yPos};
          let targetPivot = {x: d.targetNode.xPos, y: d.targetNode.yPos};

          let theta = calculateTheta(d.sourceNode, d.targetNode);

          if ('subgraph' in d.sourceNode) {
            if(!d.sourceNode.matrix) {
              return;
            }
            let index = d.sourceNode.matrix.scale.domain().indexOf(nodeIndexOf(d.sourceNode.subgraph.nodes, d.originalSource));
            updateAnchor(d.sourceNode, index, theta, _this.cfg.matrix.margin, sourceAnchor, sourcePivot);
          }
          if ('subgraph' in d.targetNode) {
            if(!d.targetNode.matrix) {
              return;
            }
            if(d.targetNode.matrix) {
              let index = d.targetNode.matrix.scale.domain().indexOf(nodeIndexOf(d.targetNode.subgraph.nodes, d.originalTarget));

              updateAnchor(d.targetNode, index, (theta + 180) % 360, _this.cfg.matrix.margin, targetAnchor, targetPivot);
            }

          }

          return _this.drawBridge(sourceAnchor.x, sourceAnchor.y, sourcePivot.x, sourcePivot.y, targetPivot.x, targetPivot.y, targetAnchor.x, targetAnchor.y);
        }).style("fill", "transparent")
          .style("stroke", _this.cfg.matrix.bridgeStroke)
          .style("stroke-width", function (d) {
            if (d.invisible) {
              return 0;
            }
            return _this.cfg.matrix.bridgeStrokeWidth;
          });


         */
  }

  drawBridge(link) {
    let _this = this;

    if (link.invisible || !link.sourceNode.x || !link.targetNode.x || !link.sourceNode.y || !link.targetNode.y) {
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
    this.orderStore.order = (this.reorderingController.getOrdering(ordering, this.submatrix, graph));
    this.update(true, null);
  }

}
