function nodetable(table, fn) {
  var thead, tbody

  function prepare() {
    thead = table.append("thead")
    tbody = table.append("tbody")

    var tr = thead.append("tr")

    tr.append("th").text("Name")
    tr.append("th").text("Status")
    tr.append("th").text("Clients")
    tr.append("th").text("WLAN Links")
    tr.append("th").text("VPN")
    tr.append("th").text("Geo")
  }

  function update(data) {
    var doc = tbody.selectAll("tr")
                   .data(data.nodes)
    
    var row = doc.enter().append("tr")

    row.classed("online", function (d) { return d.flags.online })
    
    row.append("td").text(function (d) { return d.name?d.name:d.id })
    row.append("td").text(function (d) { return d.flags.online?"online":"offline" })
    row.append("td").text(function (d) { return d.clients.length })
    row.append("td").text(function (d) { return d.wifilinks.length })
    row.append("td").text(function (d) { return d.vpns.length })
    row.append("td").text(function (d) { return d.geo?"ja":"nein" })

    $("#list").tablesorter()
  }

  var data

  function fetch(fn) {
    load_nodes(fn, data, update)
  }


  prepare()

  fetch(fn)
}

function init() {
  table = nodetable(d3.select("#list"), nodes_json)

}
