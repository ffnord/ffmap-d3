var w = window.innerWidth,
    h = window.innerHeight - 10,
    fill = d3.scale.category20();

var vis = d3.select("#chart").append("svg")
    .attr("width", w)
    .attr("height", h);

d3.json("nodes.json", function(json) {
  var force = d3.layout.force()
      .charge(-350)
      .gravity(0.05)
      .friction(0.75)
      .theta(0.1)
      .linkDistance(function (d) { return d.distance; })
      .linkStrength(function (d) { return d.strength; })
      .nodes(json.nodes)
      .links(json.links)
      .size([w, h])
      .start();

  var link = vis.selectAll("line.link")
      .data(json.links)
    .enter().append("line")
      .attr("class", "link")
      .style("stroke-width", function(d) { return Math.min(1, d.strength * 2); })
      .attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });

  var node = vis.selectAll("svg.node")
      .data(json.nodes)
    .enter().append("g")
      .attr("class", "node")
      .call(force.drag);

  node.append("ellipse")
      .attr("rx", function(d) { if (d.group == 3) return 4; else return d.name.length * 5; })
      .attr("ry", function(d) { if (d.group == 3) return 4; else return 14; })
      .style("fill", function(d) { if (d.group == 3) return fill(d.group); else return ""; })
      .style("stroke", function(d) { return fill(d.group); });

  node.append("text")
      .attr("text-anchor", "middle")
      .attr("y", "4px")
      .style("fill", function(d) { return fill(d.group); })
      .text(function(d) { if (d.group == 3) return ""; else return d.name; });

  node.append("title")
      .text(function(d) { return d.name; });

  force.on("tick", function() {
    link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
  });
});
