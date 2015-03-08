define("nodeinfo", [
  "lib/d3",
  "config"
], function (d3, ffmapConfig) {
  "use strict"

  var nodeInfo = {

    show: function(container, d) {
      var self = this
      d3.selectAll("#nodeinfo").remove()

      var nodeinfo = d3.select(container)
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
        .on("click", function(d) {
          if (d3.event.defaultPrevented)
            return
          self.show(container,d)
        })
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

  }

  return nodeInfo

})
