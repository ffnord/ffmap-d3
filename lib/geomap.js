var map
var svg, g

function init() {
  adjust_navigation()
  
  map = new L.Map("map", {
    worldCopyJump: true,
  })

  L.control.scale().addTo(map);

  map.addLayer(new L.TileLayer("http://otile{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.jpg", {
    subdomains: '1234',
    type: 'osm',
    attribution: 'Map data Tiles &copy; <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png" />, Map data © OpenStreetMap contributors, CC-BY-SA',
    opacity: 0.7,
  }))

  svg = d3.select(map.getPanes().overlayPane).append("svg")
  g   = svg.append("g").attr("class", "leaflet-zoom-hide")
  g.append("g").attr("class", "links")
  g.append("g").attr("class", "labels")
  g.append("g").attr("class", "nodes")

  svg.attr("width", 1000)
  svg.attr("height", 1000)

  d3.selectAll("#gpsbutton").on("click",  function() {
    function clickhandler(e) {
      var latlng = e.latlng
      prompt("Koordinaten:", e.latlng.lat + " " + e.latlng.lng)
      map.off("click", clickhandler)
    }
    var clickevent = map.on('click', clickhandler)
  })

  reload()
}

function project(x) {
  var point = map.latLngToLayerPoint(new L.LatLng(x[0], x[1]))
  return [point.x, point.y]
}

var data

function reload() {
  load_nodes(nodes_json, data, handler)

  function handler(json) {
    data = json

    update(data)
  }
}

function update(data) {
  var nodes = data.nodes.filter( function(d) {
    return d.geo != null
  })

  var links = data.links.filter( function(d) {
    return d.source.geo !== null && d.target.geo !== null && d.type != "vpn"
  })

  var t = [
    d3.extent(nodes, function (d) { return d.geo[0] }),
    d3.extent(nodes, function (d) { return d.geo[1] })
  ]

  var border = 0.0
  var bounds = [[t[0][0] - border, t[1][0] - border], [t[0][1] + border, t[1][1] + border]]


  var geocoords = /.*?\?lat=([0-9]{0,3}\.[0-9]*)&lon=([0-9]{0,3}\.[0-9]*)$/
  if ( geocoords.exec(document.URL) != null ) {
    map.setView(L.latLng(RegExp.$1,RegExp.$2),map.getMaxZoom())
  } else {
    map.fitBounds(bounds)
  }
  nodes_svg = g.select(".nodes").selectAll(".node").data(nodes, function(d) { return d.id })
  var links_svg = g.select(".links").selectAll(".link").data(links, function(d) { return d.id })

  var new_nodes = nodes_svg.enter().append("g").attr("class", "node")

  var circles = new_nodes.append("circle")
           .attr("r", "4pt")
           .attr("fill", function (d) {
             return d.flags.online?(d.firmware?"rgba(10, 150, 255, 1.0)":"rgba(0, 255, 0, 0.8)"):"rgba(128, 128, 128, 0.2)"
           })
           .on("click", function(n) { window.location.href = "graph.html#" + n.id })
           .append("title").text( function (n) { return n.name?n.name:n.id })

  links_svg.enter().append("line")
            .attr("class", "link")

  links_svg.style("stroke", function(d) {
        switch (d.type) {
          case "vpn":
            return linkcolor['default'](Math.max.apply(null, d.quality.split(",")))
          default:
            var q;
            try {
              q = Math.max.apply(null, d.quality.split(","))
            } catch(e) {
              q = d.quality
            }
            return linkcolor['wifi'](q)

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
        .style("margin-left", (bottomLeft[0] - margin)+ "px")
        .style("margin-top", (topRight[1] - margin)+ "px")

    g   .attr("transform", "translate(" + (margin-bottomLeft[0]) + "," + (margin-topRight[1]) + ")")

    var nodes_svg = g.selectAll(".node")
    var links_svg = g.selectAll(".link")

    nodes_svg.attr("transform", function (d) { return "translate(" + project(d.geo).join(",") + ")"})

    links_svg.attr("x1", function (d) { return project(d.source.geo)[0] })
             .attr("y1", function (d) { return project(d.source.geo)[1] })
             .attr("x2", function (d) { return project(d.target.geo)[0] })
             .attr("y2", function (d) { return project(d.target.geo)[1] })

    position_labels(nodes_svg)
  }
}

function rect_intersect(a, b) {
  return (a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y)
}

function rect_uncenter(rect) {
  return {
    x: rect.x - rect.width/2,
    y: rect.y - rect.height/2,
    width: rect.width,
    height: rect.height
  }
}

function rect_add(rect, point) {
  return {
    x: rect.x + point[0],
    y: rect.y + point[1],
    width: rect.width,
    height: rect.height
  }
}

function rect_grow(rect, x) {
  return {
    x: rect.x - x/2,
    y: rect.y - x/2,
    width: rect.width + x,
    height: rect.height + x,
  }
}

function position_labels(nodes) {
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
    occupied.push({ x: p[0] - POINT_SIZE/2, y: p[1] - POINT_SIZE/2, width: POINT_SIZE, height: POINT_SIZE })
  })

  var zoom = map.getZoom() / map.getMaxZoom()

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
      if (d != o && d.x == o.x && d.y == o.y) {
        delete labels[i]
      }
    })
  })

  labels = labels.filter(function (d) { return d != undefined })

  g.select(".labels").selectAll(".label").remove()

  var labels_svg = g.select(".labels").selectAll(".label").data(labels)

  var label_nodes = labels_svg.enter().append("g")
                         .attr("class", "label")
                         .attr("transform", function (d) { return "translate(" + [d.x, d.y].join(",") + ")"})

  label_g = label_nodes.append("g").attr("class", "textbox").append("g")

  label_g.append("g").each( function (d) {
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

  labelTextWidth = function (e) {
    return e.parentNode.querySelector("g").getBBox().width
  }

  labelTextHeight = function (e) {
    return e.parentNode.querySelector("g").getBBox().height
  }

  label_g.insert("rect", "g")
            .attr("y", function (d) { return -labelTextHeight(this) + 3})
            .attr("x", -1)
            .attr("width", function(d) { return labelTextWidth(this)})
            .attr("height", function (d) { return labelTextHeight(this)})

  label_g.each( function (d) {
    var o = d3.select(this)
    var r = o.select("rect")
    var x = -r.attr("width")/2 + 5
    var y = r.attr("height")/2 - 5
    o.attr("transform", "translate(" + [x,y].join(",") + ")")
  })

  label_nodes.each( function (d) {
    d.box = this.getBBox()
  })

  if (labels.length > 1) {
    labels.forEach( function (d, i) {
      d.angle = 0
      d.offset = 0
    })
  }

  label_nodes.each( function (d, i) {
    var box
    var intersects = false

    box = rect_add(rect_uncenter(label_box(d)), [d.x, d.y])

    occupied.forEach( function (d) {
      if (rect_intersect(d, box))
        intersects = true
    })

    if (intersects)
      this.remove()
    else
      occupied.push(box)
  })

  label_nodes.each(label_at_angle)
}

function label_box(label) {
  var offset = 4 + label.offset
  var x, y, a, b
  var angle = Math.PI*2 * label.angle

  a = offset + label.box.width/2
  b = offset + label.box.height/2

  x = a * Math.cos(angle)
  y = b * Math.sin(angle)

  return {width: label.box.width, height: label.box.height, x: x, y: y}
}

function label_at_angle(label) {
  var object = d3.select(this)
  var box = label_box(label)
  object.select(".textbox").attr("transform", "translate(" + box.x + "," + box.y + ")")
  object.select("line")
    .attr("x1", 0)
    .attr("y1", 0)
    .attr("x2", box.x)
    .attr("y2", box.y)
}
