define("geomap", [
  "lib/leaflet-src",
  "lib/d3",
  "links",
  "loader",
  "config"
], function (L, d3, linkColor, loadNodes, ffmapConfig) {
  "use strict"

  var map
  var svg, g

  window.onresize = resize

  function getOffset( el ) {
    var x = 0, y = 0

    while( el && !isNaN( el.offsetLeft ) && !isNaN( el.offsetTop ) ) {
      x += el.offsetLeft - el.scrollLeft
      y += el.offsetTop - el.scrollTop
      el = el.offsetParent
    }
    return { top: y, left: x }
  }

  function resize() {
    var offset = getOffset(document.getElementById("map"))

    var w = window.innerWidth - offset.left
    var h = window.innerHeight - offset.top - 1

    d3.select("#map").style("width", w + "px").style("height", h + "px")
  }

  function init() {
    map = new L.Map("map", {
      worldCopyJump: true
    })

    L.control.scale().addTo(map)

    map.addLayer(new L.TileLayer("http://otile{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.jpg", {
      subdomains: "1234",
      type: "osm",
      attribution: "Map data Tiles &copy; <a href=\"http://www.mapquest.com/\" target=\"_blank\">MapQuest</a> <img src=\"http://developer.mapquest.com/content/osm/mq_logo.png\" />, Map data © OpenStreetMap contributors, CC-BY-SA",
      opacity: 0.7
    }))

    svg = d3.select(map.getPanes().overlayPane).append("svg")
    g   = svg.append("g").attr("class", "leaflet-zoom-hide")
    g.append("g").attr("class", "links")
    g.append("g").attr("class", "labels")
    g.append("g").attr("class", "nodes")

    svg.attr("width", 1000)
    svg.attr("height", 1000)

    function clickhandler(e) {
      //FIXME: replace prompt with something more sane
      /*eslint no-alert: 0*/
      window.prompt("Koordinaten:", e.latlng.lat + " " + e.latlng.lng)
      map.off("click", clickhandler)
      map.getContainer().classList.remove("pick-coordinates")
    }
    d3.selectAll("#gpsbutton").on("click",  function() {
      map.off("click", clickhandler)
      map.getContainer().classList.add("pick-coordinates")
      map.on("click", clickhandler)
    })

    var nodesStream = loadNodes(ffmapConfig.nodesJSON)

    nodesStream.take(1).onValue(update)
  }

  function project(x) {
    var point = map.latLngToLayerPoint(new L.LatLng(x[0], x[1]))
    return [point.x, point.y]
  }

  function update(data) {
    var nodes = data.nodes.filter( function(d) {
      return d.geo != null
    })

    var links = data.links.filter( function(d) {
      return d.source.geo !== null && d.target.geo !== null && d.type !== "vpn"
    })

    var t = [
      d3.extent(nodes, function (d) { return d.geo[0] }),
      d3.extent(nodes, function (d) { return d.geo[1] })
    ]

    var border = 0.0
    var bounds = [[t[0][0] - border, t[1][0] - border], [t[0][1] + border, t[1][1] + border]]

    var params = {}
    var query = window.location.hash
    if (query) {
      var queryParts = query.split("#")[1].split("&")
      queryParts.forEach(function(qp) {
          var tmp = qp.split("=")
          params[tmp[0]] = decodeURIComponent(tmp[1])
      })
    }

    if (isFinite(params.lat) && isFinite(params.lon)) {
      var zoom = map.getMaxZoom()
      if (isFinite(params.zoom) && params.zoom < map.getMaxZoom() && params.zoom >= map.getMinZoom())
        zoom = params.zoom
      map.setView(L.latLng(params.lat, params.lon), zoom)
    }
    else
      map.fitBounds(bounds)

    var nodesSvg = g.select(".nodes").selectAll(".node").data(nodes, function(d) { return d.id })
    var linksSvg = g.select(".links").selectAll(".link").data(links, function(d) { return d.id })

    var newNodes = nodesSvg.enter().append("g").attr("class", "node")

    newNodes.append("circle")
            .attr("r", "4pt")
            .attr("fill", function (d) {
              return d.flags.online ? (!d.firmware ? "rgba(255, 55, 55, 1.0)" : "rgba(0, 255, 0, 0.8)") : "rgba(128, 128, 128, 0.2)"
            })
            .on("click", function(n) { window.location.href = "graph.html#" + n.id })
            .append("title").text( function (n) { return n.name ? n.name : n.id })

    linksSvg.enter().append("line")
            .attr("class", "link")

    linksSvg.style("stroke", function(d) {
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

    map.on("viewreset", reset)

    reset()

    // Reposition the SVG to cover the features.
    function reset() {
      var bottomLeft = project(bounds[0]),
          topRight = project(bounds[1])

      var margin = 300

      svg .attr("width", topRight[0] - bottomLeft[0] + 2 * margin)
          .attr("height", bottomLeft[1] - topRight[1] + 2 * margin)
          .style("margin-left", (bottomLeft[0] - margin) + "px")
          .style("margin-top", (topRight[1] - margin) +  "px")

      g   .attr("transform", "translate(" + (margin - bottomLeft[0]) + "," + (margin - topRight[1]) + ")")

      var nodesSvg = g.selectAll(".node")
      var linksSvg = g.selectAll(".link")

      nodesSvg.attr("transform", function (d) { return "translate(" + project(d.geo).join(",") + ")"})

      linksSvg.attr("x1", function (d) { return project(d.source.geo)[0] })
               .attr("y1", function (d) { return project(d.source.geo)[1] })
               .attr("x2", function (d) { return project(d.target.geo)[0] })
               .attr("y2", function (d) { return project(d.target.geo)[1] })

      positionLabels(nodesSvg)
    }
  }

  function rectIntersect(a, b) {
    return (a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y)
  }

  function rectUncenter(rect) {
    return {
      x: rect.x - rect.width / 2,
      y: rect.y - rect.height / 2,
      width: rect.width,
      height: rect.height
    }
  }

  function rectAdd(rect, point) {
    return {
      x: rect.x + point[0],
      y: rect.y + point[1],
      width: rect.width,
      height: rect.height
    }
  }

  function rectGrow(rect, x) {
    return {
      x: rect.x - x / 2,
      y: rect.y - x / 2,
      width: rect.width + x,
      height: rect.height + x
    }
  }

  function positionLabels(nodes) {
    var labels = []
    var POINT_SIZE = 8

    var occupied = []

    nodes.each( function (d) {
      var xy = project(d.geo)
      var label = {
        angle: 0.0, // rotated around center
        offset: 0,
        nodes: [d],
        x: xy[0], y: xy[1],
        v: [0, 0]
      }
      labels.push(label)
    })

    nodes.each( function (d) {
      var p = project(d.geo)
      occupied.push({ x: p[0] - POINT_SIZE / 2, y: p[1] - POINT_SIZE / 2, width: POINT_SIZE, height: POINT_SIZE })
    })

  //   var zoom = map.getZoom() / map.getMaxZoom()

    /*
    labels.forEach( function (d) {
      var t = d.nodes.map( function (d) { return project(d.geo) })
      var s = t.reduce( function (p, n) { return [p[0] + n[0], p[1] + n[1]] })
      s = [s[0]/t.length, s[1]/t.length]
      d.x = s[0]
      d.y = s[1]
    })
    */

    labels.forEach( function (d) {
      labels.forEach( function (o, i) {
        if (d !== o && d.x === o.x && d.y === o.y)
          delete labels[i]
      })
    })

    labels = labels.filter(function (d) { return d !== undefined })

    g.select(".labels").selectAll(".label").remove()

    var labelsSvg = g.select(".labels").selectAll(".label").data(labels)

    var labelNodes = labelsSvg.enter().append("g")
                           .attr("class", "label")
                           .attr("transform", function (d) { return "translate(" + [d.x, d.y].join(",") + ")"})

    var labelG = labelNodes.append("g").attr("class", "textbox").append("g")

    labelG.append("g").each( function (d) {
      var o = d3.select(this)

      d.nodes.forEach( function (n, i) {
        var name
        if (n.name)
          name = n.name
        else
          name = n.id

        o.append("text").text(name).attr("y", -i * 15)
      })
    })

    var labelTextWidth = function (e) {
      return e.parentNode.querySelector("g").getBBox().width
    }

    var labelTextHeight = function (e) {
      return e.parentNode.querySelector("g").getBBox().height
    }

    labelG.insert("rect", "g")
              .attr("y", function () { return -labelTextHeight(this) + 3})
              .attr("x", -1)
              .attr("width", function () { return labelTextWidth(this)})
              .attr("height", function () { return labelTextHeight(this)})

    labelG.each(function () {
      var o = d3.select(this)
      var r = o.select("rect")
      var x = -r.attr("width") / 2
      var y = r.attr("height") / 2 - 4
      o.attr("transform", "translate(" + [x,y].join(",") + ")")
    })

    labelNodes.each(function (d) {
      d.box = this.getBBox()
    })

    if (labels.length > 1)
      labels.forEach(function (d) {
        d.angle = 0
        d.offset = 6
      })

    function intersectsWith(box) {
      return function (acc, d) {
        return acc || rectIntersect(d, box)
      }
    }

    labelNodes.each(function (d) {
      var box
      var intersects

      var n = 100
      while (n--) {
        box = rectAdd(rectUncenter(labelBox(d)), [d.x, d.y])

        intersects = occupied.reduce(intersectsWith(box), false)

        if (intersects)
          d.angle += Math.PI * 2 / 100
        else {
          occupied.push(box)
          break
        }
      }

      if (intersects)
        this.remove()
    })

    labelNodes.each(labelAtAngle)
  }

  function labelBox(label) {
    var offset = label.offset
    var x, y, a, b
    var angle = label.angle

    a = offset + label.box.width / 2
    b = offset + label.box.height / 2

    x = a * Math.cos(angle)
    y = b * b * Math.sin(angle) / a

    return {width: label.box.width, height: label.box.height, x: x, y: y}
  }

  function labelAtAngle(label) {
    var object = d3.select(this)
    var box = labelBox(label)
    object.select(".textbox").attr("transform", "translate(" + box.x + "," + box.y + ")")
    object.select("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", box.x)
      .attr("y2", box.y)
  }

  resize()
  init()

  return {
    init: init,
    rectGrow: rectGrow
  }
})
