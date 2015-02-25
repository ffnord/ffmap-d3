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

  function loadNodes(eventStream) {
    var intervalStream = new Bacon.Bus()
    var nodes = new Bacon.Bus()
    var graph = new Bacon.Bus()
    var stream = Bacon.combineTemplate({nodes: nodes.toProperty(), graph: graph.toProperty(null)})

    intervalStream.onValue(function () {
      nodes.plug(load("data/nodes.json"))
      graph.plug(load("data/graph.json").map(".batadv").map(mapGraph))
    })

    intervalStream.plug(Bacon.once("refresh"))
    intervalStream.plug(Bacon.interval(30000, "refresh"))
    if (eventStream != null)
      intervalStream.plug(eventStream)

    return stream

    function load(filename) {
      return Bacon.fromPromise(getJSON(filename))
    }

    function mapGraph(graph) {
      graph.links.forEach(function (d) {
        d.source = graph.nodes[d.source]
        d.target = graph.nodes[d.target]
      })

      return graph
    }
  }

  return loadNodes
})
