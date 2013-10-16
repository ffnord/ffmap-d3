// adjust this for your community:
// external_node_stats_link:            the base of a link to a detailed page of each node by Hostname (false if there is none)
// external_nodes_without_hostname_link the base to a link to a detailed page of each node by MAC (false if there is none)
// node_mac_with_colons:                boolean, if the MAC in the link contains the colons ":"
// stats_base:                          base link of statistig pngs

// Kiel:
//var external_node_stats_link='http://freifunk.in-kiel.de/wiki/Nodes/'
//var external_nodes_without_hostname_link='http://freifunk.in-kiel.de/wiki/Nodes_ohne_namen#'
// node_mac_with_colons=true
//var stats_base='http://freifunk.in-kiel.de/ffmap/nodes/';

// Hamburg:
//var external_node_stats_link=false
//var external_nodes_without_hostname_link='http://www.ohrensessel.net/ffhh/view/'
//var node_mac_with_colons=false
//var stats_base=false;

// Lübeck:
var external_node_stats_link=false
var external_nodes_without_hostname_link=false
var node_mac_with_colons=false
var stats_base='http://map.ffhl/rrd/';


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
                   .data(data.nodes.filter(function (d) { return !d.flags.client }))
    
    var row = doc.enter().append("tr")

    row.classed("online", function (d) { return d.flags.online })
    row.append("td").html(function (d) {
      var nodename=(d.name?d.name:d.id)
      var node_mac=(node_mac_with_colons?d.id:d.id.replace(/:/g,''))
      var base=((d.name && external_node_stats_link)?external_node_stats_link:external_nodes_without_hostname_link)
      if(!external_nodes_without_hostname_link && !external_node_stats_link){
        return '<a href="'+stats_base+node_mac+'_upstate.png">'+nodename+'</a>'
      } else {
        var link=(external_node_stats_link?base+nodename:base+node_mac)
        
      } 
    })
    row.append("td").text(function (d) { return d.flags.online?"online":"offline" })
    row.append("td").html(function (d) { 
      var node_mac=(node_mac_with_colons?d.id:d.id.replace(/:/g,''))
      return (stats_base?('<a href="'+stats_base+node_mac+'_clients.png">'+d.clients.length+'</a>'):d.clients.length) 
    })
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
