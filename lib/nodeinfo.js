define("nodeinfo", [
  "lib/d3",
  "config",
  "chart"
], function (d3, ffmapConfig, Chart) {
  "use strict"

  function NodeInfo(container) {
    var self = this
    this.container = container
    this.chart = new Chart("#chart")
    return {
      show: function(d) {
        return self.show(d)
      }
    }
  }

  NodeInfo.prototype = {
    constructor: NodeInfo,

    show: function(d) {
      var self = this
      d3.selectAll("#nodeinfo").remove()

      var nodeinfo = d3.select(this.container)
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

      nodeinfo.append("div")
        .attr("id", "chart")

      this.chart.show(d)

      nodeinfo.append("h2").text("VPN-Links")

      nodeinfo.append("ul")
        .selectAll("li")
        .data(d.vpns)
        .enter().append("li")
        .append("a")
        .on("click", function(d) {
          if (d3.event.defaultPrevented)
            return
          self.show(d)
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

  return NodeInfo

})
