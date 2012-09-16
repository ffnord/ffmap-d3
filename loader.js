function load_nodes(filename, fn) {
  d3.json(filename, function(json) {
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
      d.vpns = []
    })

    json.links.forEach(function(d) {
      var node, other

      if (d.type == "vpn") {
        d.source.vpns.push(d.target)
        d.target.vpns.push(d.source)
      }
    })

    fn(json)
  })
}
