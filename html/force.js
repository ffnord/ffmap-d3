function getOffset( el ) {
  var _x = 0;
  var _y = 0;
  while( el && !isNaN( el.offsetLeft ) && !isNaN( el.offsetTop ) ) {
    _x += el.offsetLeft - el.scrollLeft;
    _y += el.offsetTop - el.scrollTop;
    el = el.offsetParent;
  }
  return { top: _y, left: _x };
}

var offset = getOffset(document.getElementById('chart'));

var w = window.innerWidth - offset.left,
    h = window.innerHeight - offset.top,
    fill = d3.scale.category20();

var cp = d3.select("#chart").append("div")
.attr("id", "controlpanel");

var btns = cp.append("div")
.attr("class", "btn-group")
.attr("data-toggle", "buttons-radio");

btns.append("button")
.attr("class", "btn active left")
.attr("value", "all")
.text("Everything")
.on("click", update_graph);

btns.append("button")
.attr("class", "btn right")
.attr("value", "mesh")
.text("Mesh only")
.on("click", update_graph);

function update_graph() {
  var value = jQuery(this).val()

    render_graph(value);
}

render_graph("all");

function render_graph(type) {

  d3.select("#chart svg").remove();

  var vis = d3.select("#chart").append("svg")
    .attr("width", w)
    .attr("height", h);



  d3.json("nodes.json", function(json) {
    var force = d3.layout.force()
    .charge(-100)
    .gravity(0.02)
    .friction(0.75)
    .theta(0.1)
    .linkDistance(function (d) { return d.distance; })
    .linkStrength(function (d) { return d.strength; })
    .nodes(json.nodes)
    .links(json.links)
    .size([w, h])
    .start();

    var linkedByIndex = {};

    json.links.forEach(function(d) {
          linkedByIndex[d.source.index + "," + d.target.index] = 1;
      });

  var linkdata = json.links;

  if (type == "mesh")
    linkdata = json.links.filter( function (d) {
      return d.source.group != 2 && d.target.group != 2 &&
      d.source.group != 3 && d.target.group != 3;
    });


  var link = vis.selectAll("line.link")
    .data(linkdata)
    .enter().append("line")
    .attr("class", "link")
    .style("stroke-width", function(d) { return Math.min(1, d.strength * 2); })
    .attr("x1", function(d) { return d.source.x; })
    .attr("y1", function(d) { return d.source.y; })
    .attr("x2", function(d) { return d.target.x; })
    .attr("y2", function(d) { return d.target.y; });

      function isConnected(a, b) {
            return linkedByIndex[a.index + "," + b.index] || linkedByIndex[b.index + "," + a.index] || a.index == b.index;
        }


   function fade(opacity) {
            return function(d) {
                  node.style("stroke-opacity", function(o) {
        var connected = isConnected(d, o);

        if (connected && opacity != 1)
        d3.select(this).classed("highlight", true);
        else
        d3.select(this).classed("highlight", false);

                      thisOpacity = connected ? 1 : opacity;
                      this.setAttribute('fill-opacity', thisOpacity);
                      return thisOpacity;
                  });

                  link.style("stroke-opacity", function(o) {
                        return o.source === d || o.target === d ? 1 : opacity;
                    });
              };
        } 

  function show_node_info(d) {
    if (!(typeof nodeinfo === 'undefined')) 
      nodeinfo.remove();

    nodeinfo = d3.select("#chart").append("div")
      .attr("id", "nodeinfo");

    nodeinfo.append("h1")
      .text(d.name);

    nodeinfo.append("p")
      .text(d.macs);

    nodeinfo.append("p")
      .text(d.gps);
  }

  var node = vis.selectAll("svg.node")
    .data(json.nodes.filter(function (d) {
      return type != "mesh" || (d.group != 2 && d.group != 3);
    }))
  .enter().append("g")
    .attr("class", "node")
    .on("mouseover", fade(.2))
    .on("mouseout", fade(1))
    .on("click", show_node_info)
    .call(force.drag);

  node.append("ellipse")
    .attr("rx", function(d) { if (d.group == 3) return 4; else return Math.max(10, d.name.length * 5); })
    .attr("ry", function(d) { if (d.group == 3) return 4; else return 10; })
    .style("fill", function(d) { if (d.group == 3) return fill(d.group); else return ""; })
    .style("stroke", function(d) { return fill(d.group); });

  node.append("text")
    .attr("text-anchor", "middle")
    .attr("y", "4px")
    .text(function(d) { if (d.group == 3) return ""; else return d.name; });

  node.append("title")
    .text(function(d) { return d.macs; });

  if (type == "mesh") {
    var uplink_info = node.filter(function (d) {
      if (d.uplinks !== undefined)
        return d.uplinks.length > 0;
      else
        return false;
    })
    .append("g");

    uplink_info.append("rect")
      .attr("width", 16)
      .attr("height", 16)
      .attr("x", -8)
      .attr("y", -28)
      .attr("fill", "#fff")
      .attr("stroke", "#066");

    uplink_info.append("text")
      .attr("text-anchor", "middle")
      .attr("y", 4 - 20)
      .text(function (d) {return d.uplinks.length});
  }

  force.on("tick", function() {
    link.attr("x1", function(d) { return d.source.x; })
    .attr("y1", function(d) { return d.source.y; })
    .attr("x2", function(d) { return d.target.x; })
    .attr("y2", function(d) { return d.target.y; });

  node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
  });
  });
}
