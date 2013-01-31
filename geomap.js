var map
var svg, g
var nodes_json = "nodes.json"

function init() {
  map = new L.Map("map")

  map.addLayer(new L.TileLayer("http://otile{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.jpg", {
    subdomains: '1234',
    type: 'osm',
    attribution: 'Map data Tiles &copy; <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png" />, Map data © OpenStreetMap contributors, CC-BY-SA',
  }))

  svg = d3.select(map.getPanes().overlayPane).append("svg")
  g   = svg.append("g").attr("class", "leaflet-zoom-hide")
  g.append("g").attr("class", "links")
  g.append("g").attr("class", "nodes")
  g.append("g").attr("class", "labels")

  svg.attr("width", 1000)
  svg.attr("height", 1000)

  d3.selectAll("#gpsbutton").on("click",  function() {
    function clickhandler(e) {
      var latlng = e.latlng
      alert(latlng.lat + " " + latlng.lng)
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

  var border = 0
  var bounds = [[t[0][0] - border, t[1][0] - border], [t[0][1] + border, t[1][1] + border]]

  map.fitBounds(bounds)

  var nodes_svg = g.select(".nodes").selectAll(".node").data(nodes, function(d) { return d.id })
  var links_svg = g.select(".links").selectAll(".link").data(links, function(d) { return d.id })

  var new_nodes = nodes_svg.enter().append("g").attr("class", "node")

  new_nodes.append("circle")
           .attr("r", "4pt")
           .attr("fill", function (d) {
             return d.flags.online?"rgba(0, 255, 0, 0.8)":"rgba(255, 128, 128, 0.5)"
           })
           .attr("stroke-width", "0.5px")
           .attr("stroke", "#444")

  var labels = new_nodes.append("g").attr("class", "label").attr("transform", "translate(0, 22)")
                        .style("visibility", "hidden")

  labels.append("text")
           .text(function(d) {
             if (d.name != "")
               return d.name;

             return d.id;
           })

  labelTextWidth = function (e) {
    return e.parentNode.querySelector("text").getBBox().width + 3
  }

  labelTextHeight = function (e) {
    return e.parentNode.querySelector("text").getBBox().height
  }

  labels.insert("rect", "text")
            .attr("y", function(d) { return labelTextHeight(this) / (-2)})
            .attr("x", function(d) { return labelTextWidth(this) / (-2)})
            .attr("width", function(d) { return labelTextWidth(this)})
            .attr("height", function (d) { return labelTextHeight(this)})


  nodes_svg.on("click",  function (d) { alert(d.name) })

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
    bounds = [[53.8, 10.5], [54, 11]]
    var bottomLeft = project(bounds[0]),
        topRight = project(bounds[1])

    svg .attr("width", topRight[0] - bottomLeft[0])
        .attr("height", bottomLeft[1] - topRight[1])
        .style("margin-left", bottomLeft[0] + "px")
        .style("margin-top", topRight[1] + "px")

    g   .attr("transform", "translate(" + -bottomLeft[0] + "," + -topRight[1] + ")")

    var nodes_svg = g.selectAll(".node")
    var links_svg = g.selectAll(".link")

    nodes_svg.attr("transform", function (d) { return "translate(" + project(d.geo).join(",") + ")"})

    links_svg.attr("x1", function (d) { return project(d.source.geo)[0] })
             .attr("y1", function (d) { return project(d.source.geo)[1] })
             .attr("x2", function (d) { return project(d.target.geo)[0] })
             .attr("y2", function (d) { return project(d.target.geo)[1] })

             // XXX
    if (map.getZoom() == map.getMaxZoom())
      nodes_svg.selectAll(".label").style("visibility", "visible")
    else
      nodes_svg.selectAll(".label").style("visibility", "hidden")
      nodes_svg.selectAll(".label").style("visibility", "visible")

    position_labels(nodes_svg)
  }
}

var timer

function position_labels(nodes) {
  var labels = []
  var POINT_SIZE = 30

  nodes.selectAll(".label").each( function (d) {
    var label = {
      object: this,
      box: d3.select(this).select("text")[0][0].getBBox(),
      angle: 0.0, // rotated around center 
      node: d,
      x: project(d.geo)[0],
      y: project(d.geo)[1],
      v: [0, 0]
    }
    labels.push(label)
  })
  console.log("break!")

  function push(array, o) {
    if (array.indexOf(o) != -1)
      array.push(o)
  }

  function merge_group(group, other) {
    other.labels.forEach( function (d) {
      if (group.labels.indexOf(d) != -1)
        group.labels.push(d)
    })
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

  var i = 0

  function tick() {
    labels.forEach( function (d) {
      d3.select(d.object).classed("overlap", false)
    })

    labels.forEach( function (d) {
      d.v = [0, 0]
    })

    labels.forEach( function (d) {
      labels.forEach( function (o, i) {
        if (d == o)
          return

        var boxd = label_box(d)
        var boxo = label_box(o)

        if (rect_intersect(rect_add(rect_uncenter(boxd), [d.x, d.y]), rect_add(rect_uncenter(boxo), [o.x, o.y]))) {
          d3.select(d.object).classed("overlap", true)
          d3.select(o.object).classed("overlap", true)
          var dx = boxd.x + d.x - boxo.x - o.x
          var dy = boxd.y + d.y - boxo.y - o.y

          d.v = [d.v[0] - dx/2, d.v[1] - dy/2]
          o.v = [o.v[0] + dx/2, o.v[1] + dy/2]
        }
      })
    })

    labels.forEach( function (d) {
      var x = Math.cos(d.angle)
      var y = Math.sin(d.angle)
      var rx = x + d.v[0]
      var ry = y + d.v[1]

      var s = x * rx + y * ry
      var b = Math.sqrt(rx*rx + ry*ry) * Math.sqrt(x*x + y*y)
      var beta = Math.acos(s/b)

      d.angle -= beta
    })

    labels.forEach( function (d) {
      label_at_angle(d)
    })

    console.log(i)

    i = i + 0.01
  }

  clearInterval(timer)
  timer = setInterval(tick, 100)

  labels.forEach( function (d) {
    labels.forEach( function (o, i) {
      if (d != o && d.x == o.x && d.y == o.y) {
        delete labels[i]
      }
    })
  })
  
  labels = labels.filter(function (d) { return d != undefined })

  var voronoi = d3.geom.voronoi(labels.map( function (d){ return [d.x, d.y] }))

  var tree = d3.geom.quadtree(labels)

  g.selectAll(".quad").remove()

  tree.visit( function (node, x1, y1, x2, y2) {
    return false
    g.append("rect").attr("class", "quad")
     .attr("x", x1)
     .attr("y", y1)
     .attr("width", x2 - x1)
     .attr("height", y2 - y1)
     .style("fill", "rgba(0, 0, 255, 0.03)")
     .style("stroke", "#fff")

    return false
  })

  g.select("#voronoi").remove()

  var path = g.append("g").attr("id", "voronoi").selectAll("path");
  path = path.data(voronoi.map(function(d) { return "M" + d.join("L") + "Z"; }), String);
  path.exit().remove();
  path.enter().append("path").attr("class", function(d, i) { return "q" + (i % 9) + "-9"; }).attr("d", String);
  path.order();

  labels.forEach( function (d) {
    label_at_angle(d)
  })
}

function label_box(label) {
  var offset = 10
  var x, y, a, b
  var angle = Math.PI*2 * label.angle

  a = offset + label.box.width/2
  b = offset + label.box.height/2

  x = a * Math.cos(angle)
  y = b * Math.sin(angle)

  return {width: label.box.width, height: label.box.height, x: x, y: y}
}

function label_at_angle(label) {
  var box = label_box(label)
  d3.select(label.object).attr("transform", "translate(" + box.x + "," + box.y + ")")
}
