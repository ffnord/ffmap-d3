/* globals ffmapConfig, $, d3, loadNodes */
//TODO: remove no-unused-vars config, once switched to modules
/*eslint no-unused-vars: [2, {"vars": "local"}] */
function nodetable(table, fn) {
  "use strict"

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
    tr.append("th").text("Hardware")
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
    row.append("td").text(function (d) { return d.hardware })
    row.append("td").text(function (d) { return d.firmware })

    var foot = tfoot.append("tr")
    foot.append("td").text("Summe")
    foot.append("td").text(nonClients.reduce(function(old, node) { return old + node.flags.online }, 0) + " / " + nonClients.length)
    foot.append("td").text(nonClients.reduce(function(old, node) { return old + node.clientcount }, 0))
    foot.append("td").attr("colspan", 5).style("text-align", "right").text("Zuletzt aktualisiert: " + (new Date(data.meta.timestamp + "Z")).toLocaleString())

    $("#list").tablesorter({sortList: [[0,0]]})
  }

  prepare()

  var nodesStream = loadNodes(fn)

  nodesStream.take(1).onValue(update)
}

function init() {
  "use strict"

  nodetable(d3.select("#list"), ffmapConfig.nodesJSON)
}
