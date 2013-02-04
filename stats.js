var meshinfo = d3.select("#stats")

meshinfo.append("p") .attr("id", "nodecount")

meshinfo.append("p") .attr("id", "gatewaycount")

meshinfo.append("p") .attr("id", "clientcount")

var data

function reload() {
  load_nodes(nodes_json, data, handler)

  function handler(json) {
    data = json

    var nNodes = data.nodes.filter(function(d) {
                   return !d.flags.client && d.flags.online
                 }).length,
        nGateways = data.nodes.filter(function(d) {
                   return d.flags.gateway && d.flags.online
                 }).length,
        nClients = data.nodes.filter(function(d) {
                   return d.flags.client && d.flags.online
                 }).length

    d3.select("#nodecount")
      .text(nNodes + " Knoten")

    d3.select("#gatewaycount")
      .text(nGateways + " Gateways")

    d3.select("#clientcount")
      .text("ungefähr " + (nClients - nNodes) + " Clients")
  }
}

reload()
var timer = window.setInterval(reload, 30000)

