function switch_style(s) {
  var el = document.getElementsByTagName("link")
  for (var i = 0; i < el.length; i++ ) {
    if (el[i].getAttribute("rel").indexOf("style") != -1
        && el[i].getAttribute("title")) {
          if (el[i].getAttribute("title") == s) {
            style_btn.text(s)
            el[i].disabled = false
          } else
            el[i].disabled = true
        }
  }
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

var offset = getOffset(document.getElementById('chart'))

var w = window.innerWidth - offset.left,
    h = window.innerHeight - offset.top - 1

function next_style() {
  var s = d3.select("head link[title]:not([disabled]) * link[title]")
  
  if (s[0][0] == null)
    s = d3.select("head link[title][disabled]")

  switch_style(s[0][0].getAttribute("title"))
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
  .text("Click me!")
  .on("click", pacman)

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

var linkedByIndex

var force = d3.layout.force()
              .charge( function (d) {
                if (d.flags.client)
                  return -30

                return -200
              })
              .gravity(0.035)
              .friction(0.73)
              .theta(0.8)
              .size([w, h])
              .linkDistance(function (d) {
                switch (d.type) {
                  case "vpn": return 200
                  case "client": return 20
                  default: return 70
                }
              })
              .linkStrength(function (d) {
                switch (d.type) {
                  case "vpn": return 0.05
                  case "client": return 1
                  default: return 0.8
                }
              })

force.on("tick", function() {
  var size = force.size()
  var nodes = force.nodes()
  var n = nodes.length
  for (i = 0; i < n; i++) {
    var o = nodes[i]
    if (!o.fixed) {
      node = d3.select(document.getElementById(o.id))[0][0]
      box = bounding_box(node)
      if (o.x < box.rx) o.x = box.rx
      if (o.x > size[0] - box.rx) o.x = size[0] - box.rx
      if (o.y < box.ry) o.y = box.ry
      if (o.y > size[1] - box.ry) o.y = size[1] - box.ry
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

    update()
  })
}

var linkcolor = d3.scale.linear()
                  .domain([1, 1.5, 3])
                  .range(["#0a3", "orange", "red"]);

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
                        d.source.fixed |= 2
                        d.target.fixed |= 2
                      })
                      .on("mouseout", function(d) {
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
        return linkcolor(Math.max.apply(null, d.quality.split(",")))
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
                .on("mouseover", fade(.2))
                .on("mouseout", fade(1))
                .on("click", show_node_info)
                .call(force.drag)

  nodeEnter.append("ellipse")
           .attr("class", function(d) {
             var s = []
             for (var key in d.flags)
               if (d.flags.hasOwnProperty(key) && d.flags[key])
                 s.push(key)

             return s.join(" ")
           })

  node.selectAll("ellipse")
    .attr("rx", function(d) {
      if (d.flags.client) return 4
      else return Math.max(10, d.name.length * 5)
    })
    .attr("ry", function(d) {
      if (d.flags.client) return 4
      else return 10
    })

  nodeEnter.filter(function(d) {
      return !d.flags.client
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

  linkedByIndex = {}

  links.forEach(function(d) {
    linkedByIndex[d.source.index + "," + d.target.index] = 1
  })

  if (hashstr.length != 0)
    show_node(hashstr)
}

function bounding_box(d) {
  var c = d.firstChild
  var r = {}
  switch(c.nodeName) {
    case "ellipse":
      r.rx = c.rx.animVal.value
      r.ry = c.ry.animVal.value
      break;
    case "circle":
      r.rx = r.rz = c.r.animVal.value
      break;
    default:
      r.rx = r.ry = 10
  }

  return r
}

reload()

var timer = window.setInterval(reload, 30000)
