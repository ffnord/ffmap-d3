define("graph", [
  "lib/Bacon",
  "lib/d3",
  "config",
  "links",
  "loader"
], function (Bacon, d3, ffmapConfig, linkColor, loadNodes) {
  "use strict"

  window.onresize = resize

  function resize() {

    var chart = document.getElementById("chart")

    var w = chart.offsetWidth
    var h = chart.offsetHeight

    if (force)
      force.size([w, h]).start()
  }

  var cp = d3.select("header").append("div")
             .attr("id", "controlpanel")

  cp.append("button")
      .attr("class", "btn")
      .attr("value", "reload")
      .text("Aktualisieren")
      .on("click", function () {
        refreshBus.push(new Bacon.Next("refresh"))
      })

  cp.append("button")
    .attr("class", "btn")
    .attr("value", "reload")
    .on("click", function () {
      require(["pacman"], function (pacman) {
        pacman(vis, force, data, update)
      })
    })
    .append("svg")
    .attr("width", 12)
    .attr("height", 12)
    .append("path")
    .attr("d", d3.svg.arc().innerRadius(0)
         .outerRadius(5)
         .endAngle(-Math.PI / 4 + Math.PI / 2 + 2 * Math.PI)
         .startAngle(Math.PI / 4 + Math.PI / 2))
    .attr("fill", "#888")
    .attr("transform", "translate(6,7)")


  var btns = cp.append("div")
             .attr("class", "btn-group")

  btns.append("button")
      .attr("class", "btn middle")
      .attr("value", "vpn")
      .text("VPN")
      .on("click", updateGraph)

  btns.append("button")
      .attr("class", "btn active right")
      .attr("value", "labels")
      .text("Labels")
      .on("click", updateGraph)

  cp.append("input")
    .on("keyup", function(){showNode(this.value)})
    .on("change", function(){showNode(this.value)})
    .attr("value", window.location.hash.substring(1))

  var updatedAt = cp.append("p")

  var meshinfo = d3.select("#sidebar .content")
                   .insert("div", ":first-child")

  meshinfo.append("h2").text("Mesh")

  meshinfo.append("p")
          .attr("id", "nodecount")

  meshinfo.append("p")
          .attr("id", "gatewaycount")

  meshinfo.append("p")
          .attr("id", "clientcount")

  meshinfo.append("h3").text("Gravity")
          .append("span").attr("id", "gravity")
  meshinfo.append("input").attr("type", "range").attr("min", "0").attr("max", "0.1").attr("step", "0.001")
          .attr("value",ffmapConfig.gravity)
          .on("change", function() {
            d3.select("span#gravity").text(this.value)
            force.gravity(this.value)
            force.start()
          })

  meshinfo.append("h3").text("Distance")
          .append("span").attr("id", "distance")
  meshinfo.append("input").attr("type", "range").attr("min", "0").attr("max", "2.0").attr("step", "0.01")
          .attr("value",ffmapConfig.distance)
          .on("change", function() {
            d3.select("span#distance").text(this.value)
            distScale = this.value
            force.start()
          })

  function showNode(query) {
    window.location.hash = "#" + query

    if (query.length === 0) {
      vis.selectAll(".node").classed("marked", false)
      return
    }

    vis.selectAll(".node")
      .classed("marked", function(d) {
        return ((d.id.toLowerCase().indexOf(query.toLowerCase()) >= 0) || (d.name.toLowerCase().indexOf(query.toLowerCase()) >= 0))
      })
  }

  var hashstr = window.location.hash.substring(1)

  function isConnected(a, b) {
    return linkedByIndex[a.index + "," + b.index] ||
           linkedByIndex[b.index + "," + a.index] ||
           a.index === b.index
  }

  function highlight(b) {
    return function(d) {
      if (dragging) return

      vis.selectAll(".node")
         .classed("highlight", function(o) {
           return isConnected(d, o) && b
         })

      vis.selectAll(".label")
         .classed("highlight", function(o) {
           return o === d && b
         })
    }
  }

  function gotoNode(d) {
    if (d3.event.defaultPrevented)
      return

    showNodeInfo(d)
  }

  function showNodeInfo(d) {
    d3.selectAll("#nodeinfo").remove()

    var nodeinfo = d3.select("#chart")
                 .append("div")
                 .attr("id", "nodeinfo")

    nodeinfo.append("button")
            .attr("class", "close")
            .text("x")
            .on("click", function() {
               nodeinfo.remove()
            })

    nodeinfo.append("h1")
            .text(d.name + " / " + d.id)

    if (!ffmapConfig.graph || !ffmapConfig.graph.type || ffmapConfig.graph.type !== "none") {
      nodeinfo.append("h2").text("Stats")

      if (!ffmapConfig.graph || !ffmapConfig.graph.type || ffmapConfig.graph.type === "rrd") {
        var imglink = "nodes/" + d.id.replace(/:/g, "") + ".png"

        nodeinfo.append("a")
                .attr("target", "_blank")
                .attr("href", imglink)
                .append("img")
                .attr("src", imglink)
                .attr("width", "300")

      }
      /*else if (ffmapConfig.graph.type === "graphite") {
       //TODO: Add d3 chart
      }*/

    }

    nodeinfo.append("h2").text("VPN-Links")

    nodeinfo.append("ul")
            .selectAll("li")
            .data(d.vpns)
            .enter().append("li")
                    .append("a")
                    .on("click", gotoNode)
                    .attr("href", "#")
                    .text(function(d) {
                      return d.name
                    })

    nodeinfo.append("p")
            .append("label")
            .text("Clients: " + d.clientcount)

    nodeinfo.append("p")
            .append("label")
            .text("WLAN Verbindungen: " + d.wifilinks.length)

    if (d.geo) {
      nodeinfo.append("h2").text("Geodaten")

      nodeinfo.append("p")
              .append("a")
              // Open the geomap in another window as we'd lose state of this
              // graph when the user navigates back.
              .attr("target","_blank")
              .attr("href","geomap.html#lat=" + d.geo[0] + "&lon=" + d.geo[1])
              .text(d.geo[0] + ", " + d.geo[1])
    }
  }

  function toggleButton(button) {
    button.classed("active", !button.classed("active"))
  }

  function updateGraph() {
    var button = d3.select(this)
    var value = button.attr("value")
    toggleButton(button)

    visible[value] = button.classed("active")
    update()
  }

  var vis = d3.select("#chart").append("svg")
              .attr("pointer-events", "all")
              .call(d3.behavior.zoom().on("zoom", redraw))
              .append("g")

  vis.append("g").attr("class", "links")

  vis.append("g").attr("class", "nodes")

  vis.append("g").attr("class", "labels")
                 .attr("pointer-events", "none")

  var linkedByIndex

  var chargeScale = ffmapConfig.charge,
      distScale = ffmapConfig.distance,
      strengthScale = ffmapConfig.strength

  var force = d3.layout.force()
                .charge(function (d) {
                  return -100 * chargeScale - 20 * d.clientcount
                })
                .gravity(ffmapConfig.gravity)
                .friction(ffmapConfig.friction)
                .theta(ffmapConfig.theta)
                .linkDistance(function () {
                  return 70 * distScale
                })
                .linkStrength(function (d) {
                  switch (d.type) {
                    case "vpn": return 0.01 * strengthScale
                    default: return 0.2 * strengthScale
                  }
                })
  resize()

  function tickEvent() {
    vis.selectAll(".link").selectAll("line")
        .attr("x1", function(d) { return d.source.x })
        .attr("y1", function(d) { return d.source.y })
        .attr("x2", function(d) { return d.target.x })
        .attr("y2", function(d) { return d.target.y })

    vis.selectAll(".node")
       .attr("cx", function(d) { return d.x })
       .attr("cy", function(d) { return d.y })

    vis.selectAll(".label").attr("transform", function(d) {
      return "translate(" + d.x + "," + d.y + ")"
    })
  }

  var data

  var visible = {vpn: false, labels: true}

  function reload(json) {
    data = json

    if ("meta" in data) {
      var date = new Date(data.meta.timestamp)
      updatedAt.text(date.toString("HH:mm:ss"))
    }

    var nNodes = data.nodes.filter(function(d) {
                   return d.flags.online
                 }).length,
        nGateways = data.nodes.filter(function(d) {
                   return d.flags.gateway && d.flags.online
                 }).length,
        nClients = data.nodes.reduce(function(a, d) {
                   return a + d.clientcount
                 }, 0)

    d3.select("#nodecount")
      .text(nNodes + " Knoten")

    d3.select("#gatewaycount")
      .text(nGateways + " Gateways")

    d3.select("#clientcount")
      .text("ungefähr " + nClients + " Clients")

    data = wilderScheiß(data)

    update()
  }

  function fixateGeoNodes(nodes, x) {
    nodes.filter(function(d) {
      return d.geo !== null
    }).forEach(function(d) {
      d.fixed = x
    })
  }

  function wilderScheiß(data) {
    var nodes = data.nodes.filter(function(d) {
      return d.geo !== null
    })

    var lat = nodes.map(function(d) { return d.geo[0] })
    var lon = nodes.map(function(d) { return d.geo[1] })

    var maxLat = Math.min.apply(null, lat)
    var minLat = Math.max.apply(null, lat)

    var minLon = Math.min.apply(null, lon)
    var maxLon = Math.max.apply(null, lon)

    var width = force.size()[0]
    var height = force.size()[1]

    var scaleX = width / (maxLon - minLon)
    var scaleY = height / (maxLat - minLat)

    nodes.forEach(function(d) {
      if (d.x || d.y)
        return

      d.x = (d.geo[1] - minLon) * scaleX
      d.y = (d.geo[0] - minLat) * scaleY
    })

    return data
  }

  var dragging = false

  var nodeDrag = d3.behavior.drag()
          .on("dragstart", dragstart)
          .on("drag", dragmove)
          .on("dragend", dragend)

  var d3LayoutForceDragNode

  function dragstart(d) {
    d3.event.sourceEvent.stopPropagation()
    dragging = true
    d3LayoutForceDragNode = d
    d.fixed |= 2
  }

  function dragmove() {
    d3LayoutForceDragNode.px = d3.event.x
    d3LayoutForceDragNode.py = d3.event.y
    force.resume() // restart annealing
  }

  function dragend() {
    d3.event.sourceEvent.stopPropagation()
    d3LayoutForceDragNode.fixed &= 1
    d3LayoutForceDragNode = null
    dragging = false
  }

  function labelClients(d) {
    /*eslint consistent-return: 0*/
    if (d.clientcount === 0) return

    var distance = 16
    var radius = 5
    var a = 1.2
    var angle = Math.PI
    var line = ""

    for (var i = 0; i < d.clientcount; i++) {
      if ((angle - Math.PI) > 2 * Math.PI) {
        angle = Math.PI
        distance += 2 * radius * a
      }

      line += circle(distance * Math.cos(angle), distance * Math.sin(angle), radius)

      var n = Math.floor((Math.PI * distance) / (a * radius))
      var angleDelta = 2 * Math.PI / n
      angle += angleDelta
    }

    function circle(x, y, r) {
      var rr = r.toString() + "," + r.toString()
      var tr = (2 * r).toString() + ",0"
      return "M" + (x - r).toString() + "," + y + "a" + rr +
        " 0 1,0 " + tr + "a" + rr + " 0 1,0 -" + tr
    }

    return line
  }

  function update() {
    var links = data.links
                     .filter(function (d) {
                       if (!visible.vpn && d.type === "vpn")
                         return false

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
        .style("stroke", function(d) {
          switch (d.type) {
            case "vpn":
              return linkColor.default(Math.max.apply(null, d.quality.split(",")))
            default:
              var q
              try {
                q = Math.max.apply(null, d.quality.split(","))
              } catch(e) {
                q = d.quality
              }
              return linkColor.wifi(q)

          }
        })
        .attr("class", function(d) {
          try {
            return d.quality.split(",").length === 1 ? "unidirectional" : "bidirectional"
          } catch(e) {
            return "bidirectional"
          }
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

                    if (!d.flags.online)
                      return false

                    return true
                  })

    var node = vis.select("g.nodes")
                  .selectAll(".node")
                  .data(nodes,
                    function(d) {
                      return d.id
                    }
                  )

    var nodeEnter = node.enter().append("circle")
                  .attr("class", "node")
                  .on("mouseover", highlight(true))
                  .on("mouseout", highlight(false))
                  .on("click", gotoNode)
                  .call(nodeDrag)
                  .attr("r", 8)

    node.attr("class", function(d) {
          var s = ["node"]
          if (!d.firmware)
            s.push(["legacy"])

          if (d.vpns.length > 0)
            s.push(["uplink"])

          for (var key in d.flags)
            if (d.flags.hasOwnProperty(key) && d.flags[key])
              s.push(key)

          return s.join(" ")
        })

    var label = vis.select("g.labels")
                  .selectAll("g.label")
                  .data(nodes.filter(function() {
                      return visible.labels
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

    labelEnter.append("path").attr("class", "clients")

    var geodot = labelEnter.filter(function(d) { return d.geo })

    geodot.append("circle")
                  .attr("class", "dot")
                  .attr("r", 3)

    var geodot = labelEnter.filter(function(d) { return !d.geo })

    geodot.selectAll(".dot").remove()

    labelEnter.append("text")
              .attr("class", "name")
              .attr("text-anchor", "middle")
              .attr("y", "21px")
              .attr("x", "0px")

    label.each(labelClients)

    label.selectAll("text.name")
        .text(function(d) {
          if (d.name !== "")
            return d.name

          return d.id
        })

    label.selectAll("path.clients").attr("d", labelClients)

    var labelTextWidth = function (e) {
      return e.parentNode.querySelector("text").getBBox().width + 3
    }

    labelEnter.insert("rect", "text")
              .attr("y", "10px")
              .attr("x", function() { return labelTextWidth(this) / (-2)})
              .attr("width", function() { return labelTextWidth(this)})
              .attr("height", "15px")


    label.exit().remove()

    nodeEnter.append("title")

    node.selectAll("title")
      .text(function(d) { return d.name ? d.name : " " })

    label.selectAll(".uplinks").remove()

    if (!visible.vpn) {
      var uplinkInfo = label.filter(function (d) {
        return d.vpns.length > 0
      })
      .append("g")
      .attr("class", "uplinks")

      uplinkInfo.append("path")
        .attr("d","m -2.8850049,-13.182327"
            + "c 7.5369165,0.200772 12.1529864,-1.294922 12.3338513,-10.639456"
            + "l 2.2140476,1.018191 -3.3137621,-5.293097 -3.2945999,5.20893 2.4339957,-0.995747"
            + "c -0.4041883,5.76426 -1.1549641,10.561363 -10.3735326,10.701179 z")

      uplinkInfo.append("text")
        .attr("text-anchor", "middle")
        .attr("y", 3 - 20)
        .text(function (d) {return d.vpns.length})
    }

    node.exit().remove()

    force.nodes(nodes)
         .links(links)
         .alpha(0.1)
         .start()

    if (initial === 1) {
      fixateGeoNodes(data.nodes, true)

      force.alpha(0.1)
      while(force.alpha() > 0.05)
        force.tick()

      fixateGeoNodes(data.nodes, false)

      force.alpha(0.1)
      while(force.alpha() > 0.05)
        force.tick()

      force.on("tick", tickEvent)
      force.start()

      if (window.location.hash.length > 1)
        showNode(window.location.hash.substring(1))
    }

    initial = 0

    linkedByIndex = {}

    links.forEach(function(d) {
      linkedByIndex[d.source.index + "," + d.target.index] = 1
    })

    if (hashstr.length !== 0)
      showNode(hashstr)
  }

  var initial = 1

  var refreshBus = new Bacon.Bus()

  var nodesStream = loadNodes(ffmapConfig.nodesJSON, refreshBus)

  nodesStream.onValue(reload)

  function redraw() {
    vis.attr("transform",
        "translate(" + d3.event.translate + ") "
        + "scale(" + d3.event.scale + ")")
  }

  document.querySelector("#sidebar .toggler").onclick = function() {
    var o = document.querySelector("#sidebar .content")
    o.style.display = o.style.display === "none" ? "block" : "none"
  }
})
