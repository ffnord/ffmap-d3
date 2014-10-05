define("links", [
  "lib/d3"
], function (d3) {
  "use strict"

  var linkColor = {"default":
                  d3.scale.linear()
                  .domain([1, 1.25, 1.5])
                  .range(["#0a3", "orange", "red"]),
                 "wifi":
                  d3.scale.linear()
                  .domain([1, 3, 10])
                  .range(["#0a3", "orange", "red"])
                }

  return linkColor
})
