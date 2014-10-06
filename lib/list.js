(function () {
  "use strict"

  require.config({
    shim: {
      "jquery": ["lib/jquery"],
      "lib/jquery.tablesorter": ["jquery"]
    }
  })

}())

define("list", [
  "lib/d3",
  "jquery",
  "loader",
  "config",
  "lib/jquery.tablesorter"
], function (d3, $, loadNodes, ffmapConfig) {

  "use strict"

  function nodetable(table, fn) {
    var thead, tbody, tfoot

    function prepare() {
      thead = table.append("thead")
      tbody = table.append("tbody")
      tfoot = table.append("tfoot")

      var tr = thead.append("tr")

      tr.append("th").text("Name")
      tr.append("th").text("Status")
      tr.append("th").text("Clients")
      tr.append("th").text("WLAN Links")
      tr.append("th").text("VPN")
      tr.append("th").text("Geo")
      tr.append("th").text("Firmware")
    }

    function update(data) {
      var nonClients = data.nodes.filter(function (d) { return !d.flags.client })
      var doc = tbody.selectAll("tr").data(nonClients)

      var row = doc.enter().append("tr")

      row.classed("online", function (d) { return d.flags.online })

      row.append("td").text(function (d) { return d.name ? d.name : d.id })
      row.append("td").text(function (d) { return d.flags.online ? "online" : "offline" })
      row.append("td").text(function (d) { return d.clientcount })
      row.append("td").text(function (d) { return d.wifilinks.length })
      row.append("td").text(function (d) { return d.vpns.length })
      row.append("td").text(function (d) { return d.geo ? "ja" : "nein" })
      row.append("td").text(function (d) { return d.firmware })

      var foot = tfoot.append("tr")
      foot.append("td").text("Summe")
      foot.append("td").text(nonClients.reduce(function(old, node) { return old + node.flags.online }, 0) + " / " + nonClients.length)
      foot.append("td").text(nonClients.reduce(function(old, node) { return old + node.clientcount }, 0))
      foot.append("td").attr("colspan", 4).style("text-align", "right").text("Zuletzt aktualisiert: " + (new Date(data.meta.timestamp + "Z")).toLocaleString())

      $("#list").tablesorter({sortList: [[0,0]]})
    }

    prepare()

    var nodesStream = loadNodes(fn)

    nodesStream.take(1).onValue(update)
  }

  nodetable(d3.select("#list"), ffmapConfig.nodesJSON)
})
