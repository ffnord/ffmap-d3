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
  "lib/jquery.tablesorter"
], function (d3, $, loadNodes) {

  "use strict"

  function nodetable(table) {
    var thead, tbody, tfoot

    var rows = [ ["Name", "nodeinfo/hostname"]
               , ["Status", "flags/online", function (d) { return d ? "online" : "offline" }]
               , ["Clients", "statistics/clients"]
               , ["Geo", "nodeinfo/location", function (d) { return d ? "ja" : "nein" }]
               , ["Firmware", "nodeinfo/software/firmware/release"]
               ]

    function prepare() {
      thead = table.append("thead")
      tbody = table.append("tbody")
      tfoot = table.append("tfoot")

      var tr = thead.append("tr")

      rows.forEach(function (row) {
        tr.append("th").text(row[0])
      })
    }

    function addRow(row) {
      return function (d) {
        var a = row[1].split("/").reduce(function (d, k) {
          return (d && k in d) ? d[k] : null
        }, d)

        var f = row[2] ? row[2] : function (a) {
          return a === undefined ? "(n/a)" : a
        }

        return f(a)
      }
    }

    function update(data) {
      var nodes = Object.keys(data.nodes).map(function (d) { return data.nodes[d] })
      var onlineNodes = nodes.filter(function (d) { return d.flags.online })
      var doc = tbody.selectAll("tr").data(nodes)

      doc.exit().remove()
      var row = doc.enter().append("tr")
      row.classed("online", function (d) { return d.flags.online })

      rows.forEach(function (r) {
        row.append("td").text(addRow(r))
      })

      tfoot.select("tr").remove()
      var foot = tfoot.append("tr")
      foot.append("td").text("Summe")
      foot.append("td").text(onlineNodes.length + " / " + nodes.length)
      foot.append("td").text(onlineNodes.reduce(function(a, d) { return a + d.statistics.clients }, 0))
      foot.append("td").attr("colspan", rows.length - 3).style("text-align", "right").text("Zuletzt aktualisiert: " + (new Date(data.timestamp + "Z")).toLocaleString())
    }

    prepare()

    var nodesStream = loadNodes()

    nodesStream.map(".nodes").onValue(update)
  }

  nodetable(d3.select("#list"))
})
