var map
var svg, g
var nodes_json = "nodes.json"

function init() {
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

  var border = 0.0
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

function cluster_labels(labels, max_distance) {
  max_distance *= max_distance

  while (labels.length > 1) {
    var min_distance = Infinity
    var best = [0, 0]

    labels.forEach( function (d, i) {
      labels.slice(i+1).forEach( function (o, j) {
        j += i + 1
        var dx = d.x - o.x
        var dy = d.y - o.y
        var abs = dx*dx + dy*dy
        if (abs < min_distance) {
          min_distance = abs
          best = [i, j]
        }
      })
    })

    var i = best[0], j = best[1]
    var d = labels[i]
    var o = labels[j]

    var n = d.nodes.length + o.nodes.length

    if (min_distance > max_distance * Math.pow(n, 4))
      break

    d.x = (d.x * d.nodes.length + o.x * o.nodes.length) / (d.nodes.length + o.nodes.length)
    d.y = (d.y * d.nodes.length + o.y * o.nodes.length) / (d.nodes.length + o.nodes.length)
    d.nodes = d.nodes.concat(o.nodes)
    d.cluster_distance =

    labels[j] = labels[labels.length - 1]
    labels.pop()
  }

  return labels
}

function position_labels(nodes) {
  var labels = []
  var POINT_SIZE = 15

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
  labels = cluster_labels(labels, 3 * Math.pow(1/zoom, 4))

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

  label_nodes.append("line")

  label_g = label_nodes.append("g").attr("class", "textbox").append("g")

  label_g.append("g").each( function (d) {
    var o = d3.select(this)

    if (d.nodes.length < 4)
      d.nodes.forEach( function (n, i) {
        var name
        if (n.name)
          name = n.name
        else
          name = n.id

        if (n.flags.online)
          name += " (" + (n.clients.length - 1) + ")"

        o.append("text").text(name).attr("y", -i * 15)
      })
    else {
      var clients
      try {
        clients = d.nodes.filter(function (d) { return d.flags.online }).map(function (d) { return d.clients.length - 1 }).reduce(function (p, n) { return p + n })
      } catch (e) {
        clients = 0
      }
      o.append("text").text(d.nodes.length + " Knoten (" + clients + ")").attr("y", 0).style("font-weight", "bold")
    }
  })
  /*
           .text(function(d, i) {
             var text = d.nodes.map(function (d) {
               if (d.name)
                 return d.name

               return d.id
             }).reduce( function (p, n) {
               return p + "<br/> " + n
             })
             return d.nodes.length
           })
           */

  labelTextWidth = function (e) {
    return e.parentNode.querySelector("g").getBBox().width + 10
  }

  labelTextHeight = function (e) {
    return e.parentNode.querySelector("g").getBBox().height + 5
  }

  label_g.insert("rect", "g")
            .attr("y", function (d) { return -labelTextHeight(this) + 5})
            .attr("x", -5)
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
    var voronoi = d3.geom.voronoi(labels.map( function (d){ return [d.x, d.y] }))

    var area_centers = voronoi.map( function (poly) {
      var poly = d3.geom.polygon(poly)
      return [poly.area(), poly.centroid()]
    })

    labels.forEach( function (d, i) {
      var poly = voronoi[i]
      var vectors = poly.map( function (p) {
        return [p[0] - d.x, p[1] - d.y]
      }).sort( function (b, a) {
        return (a[0]*a[0] + a[1]*a[1]) - (b[0]*b[0] + b[1]*b[1])
      })

      var v = poly.map( function (p) {
        return [p[0] - d.x, p[1] - d.y]
      }).reduce( function (p, n) {
        return [p[0] + n[0], p[1] + n[1]]
      })

      var v = vectors[0]//area_centers[i][1]
      d.voronoi_area = area_centers[i][0]
      d.voronoi_center = v
      var dx = v[0]// - d.x
      var dy = v[1]// - d.y
      var abs = Math.sqrt(dx*dx + dy*dy)
      d.angle = Math.atan2(dy/abs, dx/abs) / (2*Math.PI)
    })

    labels = labels.sort( function (a, b) {
      return (a.nodes.length * a.voronoi_area) - (b.nodes.length * b.voronoi_area)
    })
  }

  labels.forEach( function (d, i) {
    var box
    var intersects = true

    var i = 30

    while (intersects) {
      i--

      if (i == 0) {
        d.angle += Math.random()*0.02
        d.offset -= 25

        i = 30
      }

      d.offset += 1

      box = rect_add(rect_grow(rect_uncenter(label_box(d)), POINT_SIZE/2), [d.x, d.y])
      intersects = false
      occupied.forEach( function (d) {
        if (rect_intersect(d, box))
          intersects = true
      })
    }

    box = rect_add(rect_uncenter(label_box(d)), [d.x, d.y])
    occupied.push(box)
  })

  hulls = labels.filter( function (d) { return d.nodes.length > 1 })
                .map( function (d) {
                    return convexhull(d.nodes
                      .map( function (n) { return project(n.geo) })
                      .map( function (n) {
                        var d = POINT_SIZE/2
                        return  ([[-d, -d], [-d, d], [d, d], [d, -d]]).map( function (m) {
                            return [n[0] + m[0], n[1] + m[1]]
                          })
                        }).reduce( function (p, n) {
                          return p.concat(n)
                        })
                  )
                })

  label_nodes.each(label_at_angle)

  g.select(".labels").selectAll(".hulls").remove()

  var path = g.select(".labels").insert("g", ":first-child").attr("class", "hulls").selectAll("path")
  path = path.data(hulls.map(function(d) { return "M" + d.join("L") + "Z"; }), String)
  path.exit().remove()
  path.enter().append("path").attr("d", String)
  path.order()

    /*
  g.select("#voronoi").remove()

  var path = g.append("g").attr("id", "voronoi").selectAll("path");
  path = path.data(voronoi.map(function(d) { return "M" + d.join("L") + "Z"; }), String);
  path.exit().remove();
  path.enter().append("path").attr("class", function(d, i) { return "q" + (i % 9) + "-9"; }).attr("d", String);
  path.order();
    */

    /*
  g.select("#occupied").remove()

  var boxes = g.append("g").attr("id", "occupied").selectAll("rect").data(occupied)

  boxes.enter().append("rect").style("fill", "rgba(255, 0, 0, 0.5)")
               .attr("x", function (d) { return d.x })
               .attr("y", function (d) { return d.y })
               .attr("width", function (d) { return d.width })
               .attr("height", function (d) { return d.height })
               */
}

function isLeft(P0, P1, P2) {
    return (P1[0] - P0[0])*(P2[1] - P0[1]) - (P2[0] - P0[0])*(P1[1] - P0[1])
}

function convexhull(points) {
    var P = points.sort(function (a, b) {
                    var t = a[0] - b[0]
                    if (t==0) t = a[1] - b[1]
                    return t
                  })

    var n = P.length
    var H = []

    var i; // array scan index
    // Get the indices of points with min x-coord and min|max y-coord
    var minmin = 0,
        minmax

    var xmin = P[0][0]
    for (i = 0; i < n; i++) if (P[i][0] > xmin) break
    minmax = i - 1

    if (minmax == n - 1) { // degenerate case: all x-coords == xmin
        H.push(P[minmin])
        if (P[minmax][1] != P[minmin][1]) H.push(P[minmax]) // a nontrivial segment
        H.push(P[minmin]) // add polygon endpoint
        return H
    }

    // Get the indices of points with max x-coord and min|max y-coord
    var maxmin, maxmax = n - 1
    var xmax = P[n - 1][0]
    for (i = n - 2; i >= 0; i--) if (P[i][0] != xmax) break
    maxmin = i + 1

    // Compute the lower hull on the stack H
    H.push(P[minmin]) // push minmin point onto stack
    i = minmax
    while (++i <= maxmin) {
        // the lower line joins P[minmin] with P[maxmin]
        if (isLeft(P[minmin], P[maxmin], P[i]) >= 0 && i < maxmin) continue // ignore P[i] above or on the lower line

        while (H.length > 1) { // there are at least 2 points on the stack
            // test if P[i] is left of the line at the stack top
            var top = H.length - 1
            if (isLeft(H[top - 1], H[top], P[i]) > 0) break // P[i] is a new hull vertex
            else H.pop()
        }

        H.push(P[i]) // push P[i] onto stack
    }

    // Next, compute the upper hull on the stack H above the bottom hull
    if (maxmax != maxmin) H.push(P[maxmax]) // if distinct xmax points

    var bot = H.length // the bottom point of the upper hull stack
    i = maxmin
    while (--i >= minmax) {
        // the upper line joins P[maxmax] with P[minmax]
        if (isLeft(P[maxmax], P[minmax], P[i]) >= 0 && i > minmax) continue // ignore P[i] below or on the upper line

        while (H.length > bot) { // at least 2 points on the upper stack
            // test if P[i] is left of the line at the stack top
            var top = H.length - 1
            if (isLeft(H[top - 1], H[top], P[i]) > 0) break  // P[i] is a new hull vertex
            else H.pop()
        }

        if (P[i][0] == H[0][0] && P[i][1] == H[0][1]) return H

        H.push(P[i]) // push P[i] onto stack
    }

    if (minmax != minmin) H.push(P[minmin]) // push joining endpoint onto stack

    return H
}

function label_box(label) {
  var offset = 10 + label.offset
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
