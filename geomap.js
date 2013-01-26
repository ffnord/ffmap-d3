var map
var svg, g
var nodes_json = "nodes.json"

function init() {
  map = new L.Map("map", {
    center: [37.8, -96.9],
    zoom: 4
  })

  map.addLayer(new L.TileLayer("http://otile{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.jpg", {
    subdomains: '1234',
    type: 'osm',
    attribution: 'Map data ' + L.TileLayer.OSM_ATTR 
  }))

  svg = d3.select(map.getPanes().overlayPane).append("svg")
  g   = svg.append("g").attr("class", "leaflet-zoom-hide")
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

  var t = [
    d3.extent(nodes, function (d) { return d.geo[0] }),
    d3.extent(nodes, function (d) { return d.geo[1] })
  ]

  var border = 0
  var bounds = [[t[0][0] - border, t[1][0] - border], [t[0][1] + border, t[1][1] + border]]

  map.fitBounds(bounds)

  var nodes_svg = g.selectAll(".node").data(nodes, function(d) { return d.id })
  
  nodes_svg.enter().append("circle")
           .attr("class", "node")
           .attr("r", "4pt")
           .attr("fill", function (d) {
             return d.flags.online?"rgba(0, 255, 0, 0.8)":"rgba(255, 128, 128, 0.5)"
           })
           .attr("stroke-width", "0.5px")
           .attr("stroke", "#444")
  
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

    var nodes_svg = g.selectAll(".node").data(nodes, function(d) { return d.id })
    
    nodes_svg.attr("cx", function (d) { return project(d.geo)[0]})
    nodes_svg.attr("cy", function (d) { return project(d.geo)[1]})
  }
}
