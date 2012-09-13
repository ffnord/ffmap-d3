var style;

function switch_style(s) {
  var el = document.getElementsByTagName("link")
  for (var i = 0; i < el.length; i++ ) {
    if (el[i].getAttribute("rel").indexOf("style") != -1
        && el[i].getAttribute("title")) {
          /* always set to true first to workaround Chrome bug */
          el[i].disabled = true

          if (el[i].getAttribute("title") == s)
            el[i].disabled = false
        }
  }

  style_btn.text(s)
}

function getOffset( el ) {
  var _x = 0, _y = 0

  while( el && !isNaN( el.offsetLeft ) && !isNaN( el.offsetTop ) ) {
    _x += el.offsetLeft - el.scrollLeft
    _y += el.offsetTop - el.scrollTop
    el = el.offsetParent
  }
  return { top: _y, left: _x }
}

var w, h

resize()

window.onresize = resize

function resize() {
  var offset = getOffset(document.getElementById('chart'))

  w = window.innerWidth - offset.left
  h = window.innerHeight - offset.top - 1

  d3.select("#chart")
    .attr("width", w).attr("height", h)

  if (vis)
    vis.attr("width", w).attr("height", h)

  if (force)
    force.size([w, h]).start()
}

function next_style() {
  var s;
  if (style !== undefined)
    s = d3.select("head link[title=" + style + "] + link")

  if (s == null || s[0][0] == null)
    s = d3.select("head link[title]")

  style = s[0][0].getAttribute("title")
  switch_style(style)
}

var cp = d3.select("header").append("div")
           .attr("id", "controlpanel")

var updated_at = cp.append("p")

cp.append("button")
    .attr("class", "btn")
    .attr("value", "reload")
    .text("Aktualisieren")
    .on("click", reload)

var style_btn = cp.append("button")
                  .attr("class", "btn")
                  .attr("value", "reload")
                  .text("Farbwechsler")
                  .on("click", next_style)

cp.append("button")
  .attr("class", "btn")
  .attr("value", "reload")
  .on("click", pacman)
  .append("svg")
  .attr("width", 12)
  .attr("height", 12)
  .append("path")
  .attr("d", d3.svg.arc().innerRadius(0)
       .outerRadius(5)
       .endAngle(-Math.PI/4 + Math.PI/2 + 2*Math.PI)
       .startAngle(Math.PI/4 + Math.PI/2))
  .attr("fill", "#888")
  .attr("transform", "translate(6,7)")


var btns = cp.append("div")
           .attr("class", "btn-group")

btns.append("button")
    .attr("class", "btn active left")
    .attr("value", "clients")
    .text("Clients")
    .on("click", update_graph)

btns.append("button")
    .attr("class", "btn active middle")
    .attr("value", "vpn")
    .text("VPN")
    .on("click", update_graph)

btns.append("button")
    .attr("class", "btn active right")
    .attr("value", "labels")
    .text("Labels")
    .on("click", update_graph)

var meshinfo = d3.select("#sidebar")
                 .insert("div", ":first-child")

meshinfo.append("h2").text("Mesh")

meshinfo.append("p")
        .attr("id", "nodecount")

meshinfo.append("p")
        .attr("id", "gatewaycount")

meshinfo.append("p")
        .attr("id", "clientcount")

//cp.append("input")
//  .on("keyup", function(){show_node(this.value)})
//  .on("change", function(){show_node(this.value)})

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

function highlight(b) {
  return function(d) {
    if (dragging) return

    vis.selectAll("g.node")
       .classed("faded", function(o) {
         return !(isConnected(d, o)) && b
       })
       .classed("highlight", function(o) {
         return isConnected(d, o) && b
       })

    vis.selectAll("g.label")
       .classed("faded", function(o) {
         return !isConnected(d, o) && b
       })
       .classed("highlight", function(o) {
         return o == d && b
       })

    vis.selectAll(".link")
       .classed("faded", function(o) {
         return !(o.source === d || o.target === d) && b
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
        {lat: d.geo[0], lng: d.geo[1]}
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

vis.append("g").attr("class", "labels")

var linkedByIndex

var force = d3.layout.force()
              .charge( function (d) {
                if (d.flags.client)
                  return -30

                return -100
              })
              .gravity(0.035)
              .friction(0.73)
              .theta(0.8)
              .size([w, h])
              .linkDistance(function (d) {
                switch (d.type) {
                  case "client": return 20
                  default: return 70
                }
              })
              .linkStrength(function (d) {
                switch (d.type) {
                  case "vpn": return 0.01
                  case "client": return 1
                  default: return 0.2
                }
              })

function tick_event(e) {
  var size = force.size()
  var nodes = force.nodes()
  var nl = nodes.length
  for (i = 0; i < nl; i++) {
    var n = nodes[i]
    if (!n.fixed) {
      if (n.x < n.rx + 20) n.x = n.rx + 20
      if (n.x > size[0] - n.rx - 20) n.x = size[0] - n.rx - 20
      if (n.y < n.ry + 20) n.y = n.ry + 20
      if (n.y > size[1] - n.ry - 20 ) n.y = size[1] - n.ry - 20
    }
  }

  var link = vis.selectAll(".link")

  link.selectAll("line")
      .attr("x1", function(d) { return d.source.x })
      .attr("y1", function(d) { return d.source.y })
      .attr("x2", function(d) { return d.target.x })
      .attr("y2", function(d) { return d.target.y })

  vis.selectAll(".node").attr("transform", function(d) {
    return "translate(" + d.x + "," + d.y + ")";
  })

  vis.selectAll(".label").attr("transform", function(d) {
    return "translate(" + d.x + "," + d.y + ")";
  })
}

var data

var visible = {clients: true, vpn: true, labels: true}

function reload() {
  d3.json(nodes_json, function(json) {
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

    // count vpn links
    json.nodes.forEach(function(d) {
      d.vpns = 0
    })

    json.links.forEach(function(d) {
      var node, other

      if (d.type == "vpn") {
        d.source.vpns++
        d.target.vpns++
      }
    })

    data = json

    updated_at.text(d3.time.format("%X")(new Date()))

    var nNodes = data.nodes.filter(function(d) {
                   return !d.flags.client && d.flags.online
                 }).length,
        nGateways = data.nodes.filter(function(d) {
                   return d.flags.gateway && d.flags.online
                 }).length,
        nClients = data.nodes.filter(function(d) {
                   return d.flags.client && d.flags.online
                 }).length

    d3.select("#nodecount")
      .text(nNodes + " Knoten")

    d3.select("#gatewaycount")
      .text(nGateways + " Gateways")

    d3.select("#clientcount")
      .text("ungefähr " + (nClients - nNodes) + " Clients")

    data = wilder_scheiß(data)

    update()
  })
}

function fix_geonodes(nodes, x) {
  nodes.filter(function(d) {
    return d.geo !== null
  }).forEach(function(d) {
    d.fixed = x
  })
}

function wilder_scheiß(data) {
  var nodes = data.nodes.filter(function(d) {
    return d.geo !== null
  })

  var lat = nodes.map(function(d) { return d.geo[0] })
  var lon = nodes.map(function(d) { return d.geo[1] })

  var max_lat = Math.min.apply(null, lat)
  var min_lat = Math.max.apply(null, lat)

  var min_lon = Math.min.apply(null, lon)
  var max_lon = Math.max.apply(null, lon)

  var width = force.size()[0]
  var height = force.size()[1]

  var scale_x = width / (max_lon - min_lon)
  var scale_y = height / (max_lat - min_lat)

  nodes.forEach(function(d) {
    if (d.x || d.y)
      return

    d.x = (d.geo[1] - min_lon) * scale_x
    d.y = (d.geo[0] - min_lat) * scale_y
  })

  return data
}

var dragging = false

var node_drag = d3.behavior.drag()
        .on("dragstart", dragstart)
        .on("drag", dragmove)
        .on("dragend", dragend)

var d3_layout_forceDragNode

function dragstart(d) {
  dragging = true
  d3_layout_forceDragNode = d
  d.fixed |= 2
}

function dragmove() {
  d3_layout_forceDragNode.px = d3.event.x
  d3_layout_forceDragNode.py = d3.event.y
  force.resume() // restart annealing
}

function dragend() {
  d3_layout_forceDragNode.fixed &= 1
  d3_layout_forceDragNode = null
  dragging = false
}

function update() {
  var links = data.links
                   .filter(function (d) {
                     if (!visible.vpn && d.type == "vpn")
                       return false

                     if (!visible.clients && (d.source.flags.client || d.target.flags.client))
                       return false

                     // hides links to clients
                     if (!visible.vpn && (d.source.flags.vpn || d.target.flags.vpn))
                       return false

                     return true
                   })

  var link = vis.select("g.links")
                .selectAll("g.link")
                .data(links, function(d) {
                    return d.id
                })

  var linkEnter = link.enter().append("g")
                      .attr("class", function(d) {
                        return "link " + d.type
                      })
                      .on("mouseover", function(d) {
                        if (dragging) return

                        d.source.fixed |= 2
                        d.target.fixed |= 2
                      })
                      .on("mouseout", function(d) {
                        if (dragging) return

                        d.source.fixed &= 1
                        d.target.fixed &= 1
                      })

  linkEnter.append("line")
           .append("title")

  link.selectAll("line")
      .filter( function (d) {
        return d.type != 'client'
      })
      .style("stroke", function(d) {
        switch (d.type) {
          case "vpn":
            return linkcolor['default'](Math.max.apply(null, d.quality.split(",")))
          default:
            return linkcolor['wifi'](Math.max.apply(null, d.quality.split(",")))
        }
      })
      .attr("class", function(d) {
        return d.quality.split(",").length==1?"unidirectional":"bidirectional"
      })

  link.selectAll("title")
      .text( function (d) {
        var s = d.quality
        if (d.type)
          s += " (" + d.type + ")"

        return s
      })

  link.exit().remove()

  var nodes = data.nodes.filter(function (d) {
                  if (!visible.vpn && d.flags.vpn)
                    return false

                  if (!visible.clients && d.flags.client)
                    return false

                  if (!d.flags.online)
                    return false

                  return true
                })
                .sort(function(a, b) {
                  return (a.flags.client?1:0) < (b.flags.client?1:0)
                })

  var node = vis.select("g.nodes")
                .selectAll("g.node")
                .data(nodes,
                  function(d) {
                    return d.id
                  }
                )

  var nodeEnter = node.enter().append("g")
                .attr("id", function (d) {
                  return d.id
                })
                .attr("class", "node")
                .on("mouseover", highlight(true))
                .on("mouseout", highlight(false))
                .on("click", show_node_info)
                .call(node_drag)

  nodeEnter.append("ellipse")

  node.selectAll("ellipse")
      .attr("class", function(d) {
        var s = []
        for (var key in d.flags)
          if (d.flags.hasOwnProperty(key) && d.flags[key])
            s.push(key)

        return s.join(" ")
      })

  node.selectAll("ellipse")
    .attr("rx", function(d) {
      var r
      if (d.flags.client) r = 4
      else r = 8

      d.rx = r

      return r
    })
    .attr("ry", function(d) {
      var r
      if (d.flags.client) r = 4
      else r = 8

      d.ry = r

      return r
    })

  var label = vis.select("g.labels")
                .selectAll("g.label")
                .data(nodes.filter(function(d) {
                      return !d.flags.client && visible.labels
                    }), function(d) {
                    return d.id
                  }
                )

  var labelEnter = label.enter()
                    .append("g")
                    .attr("id", function (d) {
                      return d.id
                    })
                    .attr("class", "label")

  labelEnter.append("rect")
            .attr("y", "10px")
            .attr("x", function(d) { return - d.name.length * 7/2 })
            .attr("width", function(d) { return d.name.length * 7 })
            .attr("height", "15px")

  labelEnter.append("text")
            .attr("class", "name")
            .attr("text-anchor", "middle")
            .attr("y", "21px")
            .attr("x", "0px")

  label.selectAll("text.name")
      .text(function(d) {
        return d.name
      })

  label.exit().remove()

  nodeEnter.append("title")

  node.selectAll("title")
    .text(function(d) { return d.name?d.name:" " })

  node.selectAll(".uplinks").remove()

  if (!visible.vpn) {
    var uplink_info = node.filter(function (d) {
      return d.vpns > 0
    })
    .append("g")
    .attr("class", "uplinks")

    uplink_info.append("path")
      .attr("d","m -2.8850049,-13.182327"
          + "c 7.5369165,0.200772 12.1529864,-1.294922 12.3338513,-10.639456"
          + "l 2.2140476,1.018191 -3.3137621,-5.293097 -3.2945999,5.20893 2.4339957,-0.995747"
          + "c -0.4041883,5.76426 -1.1549641,10.561363 -10.3735326,10.701179 z")

    uplink_info.append("text")
      .attr("text-anchor", "middle")
      .attr("y", 3 - 20)
      .text(function (d) {return d.vpns})
  }

  node.exit().remove()

  force.nodes(nodes)
       .links(links)
       .alpha(0.1)
       .start()

  if (initial == 1) {
    fix_geonodes(data.nodes, true)

    force.alpha(0.1)
    while(force.alpha() > 0.05)
      force.tick()

    fix_geonodes(data.nodes, false)

    force.alpha(0.1)
    while(force.alpha() > 0.05)
      force.tick()

    force.on("tick", tick_event)
    force.start()
  }

  initial = 0

  linkedByIndex = {}

  links.forEach(function(d) {
    linkedByIndex[d.source.index + "," + d.target.index] = 1
  })

  if (hashstr.length != 0)
    show_node(hashstr)
}

var initial = 1

reload()

var timer = window.setInterval(reload, 30000)
