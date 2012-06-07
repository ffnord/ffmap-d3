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
    h = window.innerHeight - offset.top

var cp = d3.select("#chart").append("div")
           .attr("id", "controlpanel")

var updated_at = cp.append("p")

cp.append("button")
    .attr("class", "btn")
    .attr("value", "reload")
    .text("Aktualisieren")
    .on("click", reload)

var btns = cp.append("div")
           .attr("class", "btn-group")

btns.append("button")
    .attr("class", "btn active left")
    .attr("value", "clients")
    .text("Clients")
    .on("click", update_graph)

btns.append("button")
    .attr("class", "btn active right")
    .attr("value", "vpn")
    .text("VPN")
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
  d3.selectAll("#nodeinfo").remove()

  nodeinfo = d3.select("#chart")
               .append("div")
               .attr("id", "nodeinfo")
  nodeinfo.append("button")
          .attr("class", "close")
          .text("x")
          .on("click", function(d) {
             nodeinfo.remove()
          })

  nodeinfo.append("h1")
          .text(d.name + " / " + d.id)

  nodeinfo.append("p")
          .append("label")
          .text("macs: " + d.macs)

  if (d.geo) {
    nodeinfo.append("h2").text("Geodaten")

    nodeinfo.append("p")
            .text(d.geo)

    url = GMaps.staticMapURL({
      size: [300, 100],
      lat: d.geo[0],
      lng: d.geo[1],
      markers: [
        {lat: d.geo[0], lng: d.geo[1]},
      ]
    })

    nodeinfo.append("img")
            .attr("src", url)
  }
}

function update_graph() {
  jQuery(this).toggleClass("active")
  var value = jQuery(this).val()
  visible[value] = jQuery(this).hasClass("active")
  update()
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
      if (o.x < 10) o.x = 10
      if (o.x > size[0] - 10) o.x = size[0] - 10
      if (o.y < 10) o.y = 10
      if (o.y > size[1] - 10) o.y = size[1] - 10
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

var visible = {clients: true, vpn: true}

function reload() {
  d3.json("nodes.json", function(json) {
    // update existing nodes with new info
    // XXX inefficient data structure
    json.nodes.forEach(function(d, i) {
      var n
      force.nodes().forEach(function(x) {if (x.id == d.id) n = x})
      if (n) {
        for (var key in d)
          if (d.hasOwnProperty(key))
            n[key] = d[key]

        json.nodes[i] = n
      }
    })

    json.links.forEach(function(d, i) {
      var n
      force.links().forEach(function(x) {if (x.id == d.id) n = x})
      if (n) {
        for (var key in d)
          if (d.hasOwnProperty(key))
            n[key] = d[key]

        json.links[i] = n
      }
    })

    // replace indices with real objects
    json.links.forEach( function(d) {
      if (typeof d.source == "number") d.source = json.nodes[d.source];
      if (typeof d.target == "number") d.target = json.nodes[d.target];
    })

    // count uplinks
    json.nodes.forEach(function(d) {
      d.uplinks = undefined
    })

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

    updated_at.text(d3.time.format("%X")(new Date()))

    update()
  })
}

function update() {
  var links = data.links
                   .filter(function (d) {
                     if (!visible.clients && (d.source.group == 3 || d.target.group == 3))
                       return false 

                     if (!visible.vpn && (d.source.group == 2 || d.target.group == 2))
                       return false 

                     return true
                   })

  var link = vis.select("g.links")
                .selectAll("g.link")
                .data(links, function(d) {
                    return d.id
                })

  var linkEnter = link.enter().append("g")
                      .attr("class", "link")

  linkEnter.append("line")

  link.selectAll("line")
      .style("stroke-width", function(d) {
        return Math.max(1, d.strength * 2)
      })

  link.selectAll("path.label")
      .remove()

  link.filter(function (d) {
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

  var nodes = data.nodes.filter(function (d) {
                  if (!visible.vpn && d.group == 2)
                    return false

                  if (!visible.vpn && d.group == 3 && d.uplinks)
                    return false

                  if (!visible.clients && d.group == 3)
                    return false

                  return true
                }) 

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
           .attr("class", function(d) {
             return "group-" + d.group
           })

  node.selectAll("ellipse")
    .attr("rx", function(d) {
      if (d.group == 3) return 4
      else return Math.max(10, d.name.length * 5)
    })
    .attr("ry", function(d) {
      if (d.group == 3) return 4
      else return 10
    })

  nodeEnter.filter(function(d) {
      return d.group != 3
    })
    .append("text")
    .attr("class", "name")
    .attr("text-anchor", "middle")
    .attr("y", "4px")

  node.selectAll("text.name")
      .text(function(d) { return d.name })

  nodeEnter.append("title")

  node.selectAll("title")
    .text(function(d) { return d.macs })

  node.selectAll(".uplinks").remove()
  
  if (!visible.vpn) {
    var uplink_info = node.filter(function (d) {
      if (d.uplinks !== undefined)
        return d.uplinks.length > 0
      else
        return false
    })
    .append("g")
    .attr("class", "uplinks")

    uplink_info.append("path")
      .attr("d","m -2.8850049,-13.182327"
          + "c 7.5369165,0.200772 12.1529864,-1.294922 12.3338513,-10.639456"
          + "l 2.2140476,1.018191 -3.3137621,-5.293097 -3.2945999,5.20893 2.4339957,-0.995747"
          + "c -0.4041883,5.76426 -1.1549641,10.561363 -10.3735326,10.701179 z")
      .style("fill", "#333")

    uplink_info.append("text")
      .attr("text-anchor", "middle")
      .attr("y", 3 - 20)
      .text(function (d) {return d.uplinks.length})
  }

  node.exit().remove()

  force.nodes(nodes)
       .links(links)
       .alpha(0.1)
       .start()

  linkedByIndex = {}

  links.forEach(function(d) {
    linkedByIndex[d.source.index + "," + d.target.index] = 1
  })

  if (hashstr.length != 0)
    show_node(hashstr)
}

reload()

var timer = window.setInterval(reload, 30000)
