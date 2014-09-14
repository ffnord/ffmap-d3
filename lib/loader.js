define("loader", [
  "lib/d3",
  "lib/Bacon"
], function (d3, Bacon) {
  "use strict"

  var Promise = window.Promise
  function get(url) {
    return new Promise(function(resolve, reject) {
      var req = new XMLHttpRequest()
      req.open("GET", url)

      req.onload = function() {
        if (req.status === 200)
          resolve(req.response)
        else
          reject(new Error(req.statusText))
      }

      req.onerror = function() {
        reject(new Error("Network Error"))
      }

      req.send()
    })
  }

  function getJSON(url) {
    return get(url).then(JSON.parse)
  }

  function loadNodes(filename, eventStream) {
    var seed = { nodes: [], links: [] }
    var intervalStream = new Bacon.Bus()
    var nodesStream = intervalStream.flatMap(load(filename)).scan(seed, reduceNodes)

    intervalStream.plug(Bacon.once("refresh"))
    intervalStream.plug(Bacon.interval(30000, "refresh"))
    if (eventStream != null)
      intervalStream.plug(eventStream)

    // skip seed value
    return nodesStream.skip(1)

    function load(filename) {
      return function () {
        return Bacon.fromPromise(getJSON(filename))
      }
    }

    function reduceNodes(data, json) {
      // update existing nodes with new info
      // XXX inefficient data structure
      json.nodes.forEach(function(d, i) {
        var n
        data.nodes.forEach(function(x) {if (x.id === d.id) n = x})
        if (n) {
          for (var key in d)
            if (d.hasOwnProperty(key))
              n[key] = d[key]

          json.nodes[i] = n
        }
      })

      json.links.forEach(function(d, i) {
        var n
        data.links.forEach(function(x) {if (x.id === d.id) n = x})
        if (n) {
          for (var key in d)
            if (d.hasOwnProperty(key))
              n[key] = d[key]

          json.links[i] = n
        }
      })

      // replace indices with real objects
      json.links.forEach( function(d) {
        if (typeof d.source === "number") d.source = json.nodes[d.source]
        if (typeof d.target === "number") d.target = json.nodes[d.target]
      })

      // count vpn links
      json.nodes.forEach(function(d) {
        d.vpns = []
        d.wifilinks = []
      })

      json.links.forEach(function(d) {
        if (d.type === "vpn") {
          d.source.vpns.push(d.target)
          d.target.vpns.push(d.source)
        } else {
          d.source.wifilinks.push(d.target)
          d.target.wifilinks.push(d.source)
        }
      })

      return json
    }
  }

  return loadNodes
})
