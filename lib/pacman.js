define("pacman", [
  "lib/d3"
], function (d3) {
  "use strict"

  function pacman(vis, force, data, update) {
    var angle = d3.scale.linear()
                      .domain([0, 1, 2, 3])
                      .range([0.01, Math.PI / 4, 0.01, Math.PI / 4])

    d3.timer(pacmanAnimate)
    var a = 0

    var p = {x: 0, y: 0}
    var pm = vis.append("path")
                    .style("fill", "#ff0")
                    .style("stroke", "#000")
                    .style("stroke-width", 2.5)
                    .style("stroke-linejoin", "round")

    function pacmanAnimate() {
      var nodes = force.nodes()
      var n = nodes.length
      if (n === 0)
        return

      a = (a + 0.10) % 2

      pm.attr("d", d3.svg.arc().innerRadius(0)
         .outerRadius(24).endAngle(-angle(a) + Math.PI / 2 + 2 * Math.PI).startAngle(angle(a) + Math.PI / 2))

      var closest = null
      var dd = Infinity
      for (var i = 0; i < n; i++) {
        var o = nodes[i]

        var d = Math.pow((o.x - p.x),2) + Math.pow( o.y - p.y, 2)
        if (d < dd) {
          dd = d
          closest = o
        }
      }

      var dx = closest.x - p.x
      var dy = closest.y - p.y

      var d = Math.sqrt(Math.pow(dx,2) + Math.pow(dy,2))

      dx = dx / d
      dy = dy / d

      if (d > 8) {
        p.x += dx * 2
        p.y += dy * 6
      } else {
        var snd
        if (closest.flags.client)
          snd = new Audio("lib/pacman_eatfruit.wav")
        else
          snd = new Audio("lib/pacman_eatghost.wav")
        snd.play()

        data.nodes = data.nodes.filter(function (d) {
          return d.id !== closest.id
        })

        data.links = data.links.filter(function (d) {
          return d.target.id !== closest.id && d.source.id !== closest.id
        })
        update()
      }

      pm.attr("transform", "matrix(" + [dx, dy, -dy, dx, p.x, p.y].join(",") + ")")
    }
  }

  return pacman
})
