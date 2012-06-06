function getOffset( el ) {
  var _x = 0, _y = 0

  while( el && !isNaN( el.offsetLeft ) && !isNaN( el.offsetTop ) ) {
    _x += el.offsetLeft - el.scrollLeft
    _y += el.offsetTop - el.scrollTop
    el = el.offsetParent
  }
  return { top: _y, left: _x }
}

var offset = getOffset(document.getElementById('chart'))

var w = window.innerWidth - offset.left,
    h = window.innerHeight - offset.top,
    fill = d3.scale.category20()

var cp = d3.select("#chart").append("div")
           .attr("id", "controlpanel")

var btns = cp.append("div")
           .attr("class", "btn-group")
           .attr("data-toggle", "buttons-radio")

btns.append("button")
    .attr("class", "btn active left")
    .attr("value", "all")
    .text("Alles")
    .on("click", update_graph)

btns.append("button")
    .attr("class", "btn right")
    .attr("value", "mesh")
    .text("nur Mesh")
    .on("click", update_graph)

cp.append("label")
  .text("Knoten hervorheben:")

cp.append("br")

cp.append("input")
  .on("keyup", function(){show_node(this.value)})
  .on("change", function(){show_node(this.value)})

function show_node(mac) {
  d3.selectAll("#chart .node")
    .classed("marked", false)

  if (mac.length == 0)
    return

  d3.selectAll("#chart .node")
    .each( function(d) {
      if (d.id == mac) 
        d3.select(this)
          .classed("marked", true)
    })
}

var hashstr = window.location.hash.substring(1)

function isConnected(a, b) {
  return linkedByIndex[a.index + "," + b.index] ||
         linkedByIndex[b.index + "," + a.index] ||
         a.index == b.index
}

function fade(opacity) {
  return function(d) {
    vis.selectAll("g.node")
       .style("stroke-opacity", function(o) {
         var connected = isConnected(d, o)

         if (connected && opacity != 1)
           d3.select(this)
             .classed("highlight", true)
         else
           d3.select(this)
             .classed("highlight", false)

         thisOpacity = connected?1:opacity
         this.setAttribute('fill-opacity', thisOpacity)
         return thisOpacity
       })

    vis.selectAll(".link *")
       .style("stroke-opacity", function(o) {
         return o.source === d || o.target === d ? 1 : opacity
       })
  }
} 

function show_node_info(d) {
  if (typeof nodeinfo !== 'undefined')
    nodeinfo.remove();

  nodeinfo = d3.select("#chart")
               .append("div")
               .attr("id", "nodeinfo")
  nodeinfo.append("h1")
          .text(d.name)
  nodeinfo.append("p")
          .text("primary: " + d.id)
  nodeinfo.append("p")
          .text("macs: " + d.macs)
  nodeinfo.append("p")
          .text(d.gps)
}

function update_graph() {
  var value = jQuery(this).val()
  update(data, value)
}

var vis = d3.select("#chart").append("svg")
            .attr("width", w)
            .attr("height", h)

vis.append("g").attr("class", "links")

vis.append("g").attr("class", "nodes")

var linkedByIndex

var force = d3.layout.force()
              .charge(-100)
              .gravity(0.02)
              .friction(0.75)
              .theta(0.1)
              .size([w, h])
              .linkDistance(function (d) { return d.distance; })
              .linkStrength(function (d) { return d.strength; })

force.on("tick", function() {
  var size = force.size()
  var nodes = force.nodes()
  var n = nodes.length
  for (i = 0; i < n; i++) {
    var o = nodes[i]
    if (!o.fixed) {
      if (o.x < 0) o.x = 10
      if (o.x > size[0]) o.x = size[0] - 10
      if (o.y < 0) o.y = 10
      if (o.y > size[1]) o.y = size[1] - 10
    }
  }

  var link = vis.selectAll(".link")

  link.selectAll("line")
      .attr("x1", function(d) { return d.source.x })
      .attr("y1", function(d) { return d.source.y })
      .attr("x2", function(d) { return d.target.x })
      .attr("y2", function(d) { return d.target.y })

  link.selectAll(".label")
      .attr("transform", function(d) { 
        π = Math.PI
        Δx = d.source.x - d.target.x
        Δy = d.source.y - d.target.y
        m = Δy/Δx
        α = Math.atan(m)
        α += Δx<0?π:0
        sin = Math.sin(α)
        cos = Math.cos(α)
        x = (Math.min(d.source.x, d.target.x) + Math.abs(Δx) / 2)
        y = (Math.min(d.source.y, d.target.y) + Math.abs(Δy) / 2)
        return "matrix(" + [cos, sin, -sin, cos, x, y].join(",") + ")"
      })

  vis.selectAll(".node").attr("transform", function(d) { 
    return "translate(" + d.x + "," + d.y + ")";
  })
})

var data

d3.json("nodes.json", function(json) {
  json.links.forEach(function(d) {
    var node, other

    if (d.source.group == 2) {
      node = d.target;
      other = d.source;
    }

    if (d.target.group == 2) {
      node = d.source;
      other = d.target;
    }

    if (node) {
      if (node.uplinks === undefined)
    node.uplinks = new Array();

    node.uplinks.push(other);
    }
  })

  data = json

  update(data, "all")
})

function update(src, type) {
  var linkdata = data.links;

  var links = force.links(data.links
                   .filter(function (d) {
                     return type != "mesh" ||
                            d.source.group != 2 &&
                            d.source.group != 3 &&
                            d.target.group != 2 &&
                            d.target.group != 3
                   })
               ).links()

  var link = vis.select("g.links")
                .selectAll("g.link")
                .data(links, function(d) {
                    return d.id
                })

  var linkEnter = link.enter().append("g")
                      .attr("class", "link")

  linkEnter.append("line")
    .style("stroke-width", function(d) {
      return Math.min(1, d.strength * 2)
    })

  linkEnter.filter(function (d) {
        return d.quality != "TT" && d.quality != "1.000"
      })
      .append("path")
      .attr("class", "label")
      .attr("d", d3.svg.zigzag()
                       .amplitude(function (d) {
                         return Math.pow((1 - 1/d.quality), 0.5) * 8;
                       })
                       .len(30)
                       .angularFrequency(4)
      )

  link.exit().remove()

  var nodes = force.nodes(data.nodes
                .filter(function (d) {
                  return type != "mesh" ||
                        (d.group != 2 && d.group != 3)
                })
              ).nodes()

  var node = vis.select("g.nodes")
                .selectAll("g.node")
                .data(nodes,
                  function(d) {
                    return d.id
                  }
                )
  var nodeEnter = node.enter().append("g")
                .attr("class", "node")
                .on("mouseover", fade(.2))
                .on("mouseout", fade(1))
                .on("click", show_node_info)
                .call(force.drag)

  nodeEnter.append("ellipse")
    .attr("rx", function(d) {
      if (d.group == 3) return 4
      else return Math.max(10, d.name.length * 5)
    })
    .attr("ry", function(d) {
      if (d.group == 3) return 4
      else return 10
    })
    .style("fill", function(d) {
      if (d.group == 3) return fill(d.group)
      else return ""
    })
    .style("stroke", function(d) {
      return fill(d.group)
    })

  nodeEnter.filter(function(d) {
      return d.group != 3
    })
    .append("text")
    .attr("text-anchor", "middle")
    .attr("y", "4px")
    .text(function(d) { return d.name })

  nodeEnter.append("title")
    .text(function(d) { return d.macs })

  if (type == "mesh") {
    var uplink_info = node.filter(function (d) {
      if (d.uplinks !== undefined)
      return d.uplinks.length > 0;
      else
      return false;
    })
    .append("g");

    uplink_info.append("path")
      .attr("d","m -2.8850049,-13.182327"
          + "c 7.5369165,0.200772 12.1529864,-1.294922 12.3338513,-10.639456"
          + "l 2.2140476,1.018191 -3.3137621,-5.293097 -3.2945999,5.20893 2.4339957,-0.995747"
          + "c -0.4041883,5.76426 -1.1549641,10.561363 -10.3735326,10.701179 z")
      .style("fill", "#333");

    uplink_info.append("text")
      .attr("text-anchor", "middle")
      .attr("y", 3 - 20)
      .text(function (d) {return d.uplinks.length});
  }

  node.exit().remove()

  force.start()

  linkedByIndex = {}

  links.forEach(function(d) {
    linkedByIndex[d.source.index + "," + d.target.index] = 1
  })

  if (hashstr.length != 0)
    show_node(hashstr)
}
