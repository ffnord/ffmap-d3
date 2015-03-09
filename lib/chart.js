define("chart", [
  "lib/d3",
  "config"
], function (d3, ffmapConfig) {
  "use strict"

  var Chart = function Chart(container) {
    var self = this
    this.container = container
    this.config = ffmapConfig.chart ? ffmapConfig.chart : { type: "none" }
    this.state = null
    this.data = null
    return {
      show: function (d) {
        self.draw(d)
      }
    }
  }

  Chart.prototype = {


    constructor: Chart,


    format: {
      bytes: function (d) {
        d = parseInt(d)
        if (d > (1024 * 1024 * 1024 * 1024))
          return d3.round(d / (1024 * 1024 * 1024 * 1024), 0) + " TB"
        else if (d > (1024 * 1024 * 1024))
          return d3.round(d / (1024 * 1024 * 1024), 0) + " GB"
        else if (d > (1024 * 1024))
          return d3.round(d / (1024 * 1024), 0) + " MB"
        else if (d > 1024)
          return d3.round(d / (1024), 0) + " kB"
        else return d + " B"
      },
      time: function (d) {
        d = parseInt(d)
        if (d > 172800)
          return d3.round(d / 86400, 0) + "d"
        else if (d > 3600)
          return d3.round(d / 3600, 0) + "h"
        else if (d > 60)
          return d3.round(d / 60, 0) + "m"
        else return d + "s"
      }
    },


    loadJSON: function (d, callback) {
      if (this.config.onLoadJSON)
        this.config.onLoadJSON(d.id, function (data) {
          callback(data)
        })
      else
        d3.json("stats/nodes/" + d.id + "/statistics.json", function (error, data) {
          var chartData = {}
          if (data)
            data.forEach(function (range) {
              if (range)
                range.forEach(function (data) {
                  chartData[data.target] = {
                    points: data.datapoints.map(function (p) {
                      return {
                        x: new Date(p[1] * 1000),
                        y: (p[0] !== null) ? p[0] : 0
                      }
                    })
                  }
                })
            })
          callback(chartData)
        })
    },


    drawRRD: function (el, d) {
      var imglink = "nodes/" + d.id.replace(/:/g, "") + ".png"
      el.append("a")
        .attr("target", "_blank")
        .attr("href", imglink)
        .append("img")
        .attr("src", imglink)
        .attr("width", "300")
    },


    drawJSON: function (el, d) {
      var self = this
      this.drawJSONMetricNav(el)

      // Chart container
      el.append("div")
        .attr("class", "chart-container")

      this.drawJSONRangeNav(el)

      // Legend container
      el.append("ul")
        .attr("class", "chart-legend").classed("hidden")

      if (this.state === null)
        this.state = {
          metric: this.config.defaults.metric,
          range: this.config.defaults.range
        }

      this.loadJSON(d, function (data) {
        console.log(data)
        self.data = data
        self.drawJSONChart(el)
      })

    },


    drawJSONChart: function (el) {
      var self = this

      var chart = el.select(".chart-container")

      // Update navs
      el.selectAll("ul.chart-ranges li").classed("active", false)
      el.select("ul.chart-ranges li.chart-range-" + this.state.range).classed("active", true)
      el.selectAll("ul.chart-metrics li").classed("active", false)
      el.select("ul.chart-metrics li.chart-metric-" + this.state.metric).classed("active", true)

      // Clear old chart
      chart.select("svg").remove()

      // Get metric and range config objects
      var oMetric = this.config.metrics[this.state.metric]
      var oRange = this.config.ranges[this.state.range]

      // Set chart dimensions
      var margin = {
          top: 15,
          right: 10,
          bottom: 35,
          left: (oMetric.margin && oMetric.margin.left ? oMetric.margin.left : 30)
        },
        width = 400 - margin.left - margin.right,
        height = 250 - margin.top - margin.bottom

      // Configure axis
      var x = d3.time.scale()
        .range([0, width])

      var y = d3.scale.linear()
        .range([height, 0])

      var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")

      var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")

      var xGrid = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .tickSize(-height, 0, 0)
        .tickFormat("")

      var yGrid = d3.svg.axis()
        .scale(y)
        .orient("left")
        .tickSize(-width, 0, 0)
        .tickFormat("")

      var area = d3.svg.area()
        .x(function (d) {
          return x(d.x)
        })
        .y0(height)
        .y1(function (d) {
          return y(d.y)
        })

      var line = d3.svg.line()
        .x(function (d) {
          return x(d.x)
        })
        .y(function (d) {
          return y(d.y)
        })

      var axisFormatRotate = function (node) {
        node.selectAll("text")
          .classed("rotated", true)
          .style("text-anchor", "end")
          .attr("dx", "-.8em")
          .attr("dy", ".15em")
          .attr("transform", function () {
            return "rotate(-65)"
          })
      }

      // Calc min/max values for axis
      var minX = d3.min(oMetric.sources.map(function (source) {
        return d3.min(
          (self.data && self.data[source.name + "_" + self.state.range] && self.data[source.name + "_" + self.state.range].points)
            ? self.data[source.name + "_" + self.state.range].points
            : [0], function (p) {
          return p.x
        })
      }))
      var maxX = d3.max(oMetric.sources.map(function (source) {
        return d3.max(
          (self.data && self.data[source.name + "_" + self.state.range] && self.data[source.name + "_" + self.state.range].points)
            ? self.data[source.name + "_" + self.state.range].points
            : [0], function (p) {
          return p.x
        })
      }))
      var maxY = d3.max(oMetric.sources.map(function (source) {
        return d3.max(
          (self.data && self.data[source.name + "_" + self.state.range] && self.data[source.name + "_" + self.state.range].points)
            ? self.data[source.name + "_" + self.state.range].points
            : [0], function (p) {
          return p.y
        })
      }))

      // Set the min/max values
      x.domain([minX, maxX])
      y.domain([0, maxY])

      // Create svg container
      var svg = chart.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .attr("class", "range-" + this.state.range + " metric-" + this.state.metric)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

      // Add x axis
      svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis.tickFormat(function (d) {
          return (oRange.tickFormat ? oRange.tickFormat(d) : d)
        }))
        .call(function () {
          if (oRange.axisFormat)
            oRange.axisFormat(this)
          else if (oRange.rotateTicks)
            axisFormatRotate(this)
        })

      // Add y axis
      svg.append("g")
        .attr("class", "y axis")
        .call(yAxis.tickFormat(function (d) {
          if (oMetric.tickFormat)
            if (typeof oMetric.tickFormat === "string")
              if (oMetric.tickFormat === "bytes")
                return self.format.bytes(d)
              else if (oMetric.tickFormat === "time")
                return self.format.time(d)
              else return oMetric.tickFormat(d)
          return d
        }))
        .call(function () {
          if (oMetric.axisFormat) oMetric.axisFormat(this)
        })

      // Add grid
      var grid = svg.append("g").attr("class", "grid")
      grid.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(xGrid)
      grid.append("g")
        .call(yGrid)

      // Add graph container
      var graph = svg.append("g").attr("class", "graph")

      // Define gradient for area fill
      var areaGradient = graph.append("defs")
        .append("linearGradient")
        .attr("id", "area-gradient")
        .attr("x1", "0")
        .attr("x2", "0")
        .attr("y1", "0")
        .attr("y2", "100%")
      areaGradient.append("stop")
        .attr("class", "area-gradient-stop1")
        .attr("offset", "0%")
      areaGradient.append("stop")
        .attr("class", "area-gradient-stop2")
        .attr("offset", "100%")

      // Draw chart
      oMetric.sources.forEach(function (source) {

        if (self.data
          && self.data[source.name + "_" + self.state.range]
          && self.data[source.name + "_" + self.state.range].points) {

          // Line chart
          if (!source.hasOwnProperty("type") || source.type === "line")
            graph.append("path")
              .datum(self.data[source.name + "_" + self.state.range].points)
              .attr("class", "line")
              .style({
                stroke: (source.color ? source.color : null)
              })
              .attr("d", line
                .interpolate(source.interpolation ? source.interpolation : "monotone")
            )

          // Fill area
          if (oMetric.sources.length === 1)
            graph.append("path")
              .datum(self.data[source.name + "_" + self.state.range].points)
              .attr("class", "area")
              .attr("d", area
                .interpolate(source.interpolation ? source.interpolation : "monotone")
            )
              .style("fill", "url(#area-gradient)")

          // Points
          if (!source.hasOwnProperty("showPoints") || source.showPoints !== false)
            graph.append("g")
              .attr("class", "points")
              .selectAll("circle")
              .data(self.data[source.name + "_" + self.state.range].points)
              .enter().append("circle")
              .attr("cx", function (d) {
                return x(d.x)
              })
              .attr("cy", function (d) {
                return y(d.y)
              })
              .attr("r", 2.0)
              .style({
                fill: (source.color ? source.color : null)
              })
              .attr("onmouseover", "evt.target.setAttribute('r', '4.0')")
              .attr("onmouseout", "evt.target.setAttribute('r', '2.0')")
              .append("svg:title")
              .text(function (d) {
                if (oMetric.tickFormat)
                  if (typeof oMetric.tickFormat === "string")
                    if (oMetric.tickFormat === "bytes")
                      return self.format.bytes(d.y)
                    else if (oMetric.tickFormat === "time")
                      return self.format.time(d.y)
                    else return oMetric.tickFormat(d.y)
                return d3.round(d.y, 2)
              })
        }
      })

      //Draw legend
      var legend = el.select(".chart-legend")
      if (oMetric.sources.length > 1) {
        // Metric nav
        legend.selectAll("li").remove()
        oMetric.sources.forEach(function (source) {
          legend.append("li")
            .attr("class", "chart-legend-" + source.name)
            .call(function (node) {
              node.append("div").attr("class", "marker").style({"background-color": source.color ? source.color : null})
            })
            .call(function (node) {
              node.append("div").attr("class", "label").text(source.label)
            })
        })
        legend.classed("hidden", false)
      }
      else
        legend.classed("hidden", true).selectAll("li").remove()
    },


    drawJSONRangeNav: function (el) {
      var self = this
      el.append("ul")
        .attr("class", "chart-ranges")
        .selectAll("li")
        .data(d3.entries(this.config.ranges))
        .enter().append("li")
        .attr("class", function (item) {
          return "chart-range-" + item.key
        })
        .append("a")
        .on("click", function (item) {
          self.state.range = item.key
          self.drawJSONChart(el)
        })
        .attr("href", "#")
        .text(function (item) {
          return item.value.label
        })
      el.append("br").attr("class", "clear")
    },


    drawJSONMetricNav: function (el) {
      var self = this
      el.append("ul")
        .attr("class", "chart-metrics")
        .selectAll("li")
        .data(d3.entries(this.config.metrics))
        .enter().append("li")
        .attr("class", function (item) {
          return "chart-metric-" + item.key
        })
        .append("a")
        .on("click", function (item) {
          self.state.metric = item.key
          self.drawJSONChart(el)
        })
        .attr("href", "#")
        .text(function (item) {
          return item.value.label
        })
      el.append("br").attr("class", "clear")
    },


    draw: function (d) {
      var chart = d3.select(this.container)
      chart.selectAll("*").remove()
      if (this.config.type && this.config.type !== "none") {
        chart.append("h2").text("Statistiken")
        if (this.config.type === "rrd")
          this.drawRRD(chart, d)
        else if (this.config.type === "json")
          this.drawJSON(chart,d)
      }
    }
  }

  return Chart

})
