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
           .attr("text-anchor", "middle")

  labelTextWidth = function (e) {
    return e.parentNode.querySelector("text").getBBox().width + 3
  }

  labelTextHeight = function (e) {
    return e.parentNode.querySelector("text").getBBox().height
  }

  labels.insert("rect", "text")
            .attr("y", function(d) { return labelTextHeight(this) / (-1) + 3})
            .attr("x", function(d) { return labelTextWidth(this) / (-2)})
            .attr("width", function(d) { return labelTextWidth(this)})
            .attr("height", function (d) { return labelTextHeight(this) + 3})


  nodes_svg.on("click",  function (d) { alert(d.name) })

  links_svg.enter().append("line")
            .attr("class", "link")
            .attr("stroke-width", "2.5pt")
            .attr("opacity", 0.5)

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

    if (map.getZoom() == map.getMaxZoom())
      nodes_svg.selectAll(".label").style("visibility", "visible")
    else
      nodes_svg.selectAll(".label").style("visibility", "hidden")
  }
}
