/* globals d3 */
//TODO: remove no-unused-vars config, once switched to modules
/*eslint no-unused-vars: [2, {"vars": "local"}] */
var linkColor = {"default":
                  d3.scale.linear()
                  .domain([1, 1.25, 1.5])
                  .range(["#0a3", "orange", "red"]),
                 "wifi":
                  d3.scale.linear()
                  .domain([1, 3, 10])
                  .range(["#0a3", "orange", "red"])
                }
