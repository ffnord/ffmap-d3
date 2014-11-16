define("geomap/main", [
  "jquery",
  "lib/backbone",
  "lib/leaflet-src",
  "lib/Bacon",
  "lib/d3"
], function ($, Backbone, L, Bacon, d3) {
  "use strict"

  var Graph = Backbone.Model.extend({
    initialize: function (options) {
      this.stream = options.stream
      this.map = options.map

      this.nodes = this.stream.flatMap(function (data) {
        return data.nodes.filter(function (node) {
          return node.geo !== null
        })
      })

      this.bounds = this.nodes.scan({}, function (bounds, nodes) {
        var t = [
          d3.extent(nodes, function (d) { return d.geo[0] }),
          d3.extent(nodes, function (d) { return d.geo[1] })
        ]
        var border = 0.0
        bounds.x1 = t[0][1] + border
        bounds.y1 = t[1][1] + border
        bounds.x2 = t[0][0] - border
        bounds.y2 = t[1][0] - border

        return bounds
      })

      this.bounds.changes().onValue(this, "set", "bounds")
    },
    project: function (x) {
      var point = this.map.latLngToLayerPoint(new L.LatLng(x[0], x[1]))
      return [point.x, point.y]
    }

  })

  var NodesOverlayView = Backbone.View.extend({
    tagName: "svg",
    margin: 300,
    initialize: function (options) {
      if (options.parent) $(options.parent).append(this.$el)
      this.$nodes = $("<g>").addClass("nodes")

      this.model.nodes.flatMap(function (model, $nodes, nodes) {
        return nodes.map(function (n) {
          var newNode = $("<g>").addClass("node")
          return newNode.append(
            $("<circle>")
              .attr("r", "4pt")
              .attr("fill", n.flags.online ? (!n.firmware ? "rgba(255, 55, 55, 1.0)" : "rgba(0, 255, 0, 0.8)") : "rgba(128, 128, 128, 0.2)")
              .attr("transform", "translate(" + model.project(n.geo).join(",") + ")")
              .append(
                $("<title>").text(n.name ? n.name : n.id)
              )
          )
        }).reduce(function (acc, $n) {
          return acc.append($n)
        }, $nodes)
      }, this.model, this.$nodes).onValue(function (v) {
        console.log(v)
      })

      this.listenTo(this.model, "change:bounds", this.updateBounds)
    },
    updateBounds: function (model, b) {
      this.$el
        .attr("width", b.x2 - b.x1 + 2 * this.margin)
        .attr("height", b.y2 - b.y1 + 2 * this.margin)
        .css("margin-left", (b.x1 - this.margin) + "px")
        .css("margin-top", (b.y2 - this.margin) +  "px")

      this.$el.find(".leaflet-zoom-hide").attr("transform", "translate(" + (this.margin - b.x1) + "," + (this.margin - b.y2) + ")")
    },
    render: function () {
      var g = $("<g>").addClass("leaflet-zoom-hide")
      g.append(
        $("<g>").addClass("links"),
        $("<g>").addClass("labels"),
        this.$nodes
      )
      this.$el.empty().append(g)
      return this
    }
  })

  var MainView = Backbone.View.extend({
    tagName: "div",
    initialize: function (options) {
      this.$map = $("<div>").attr("id", "map")

      this.map = new L.Map(this.$map[0], {
        worldCopyJump: true
      })

      L.control.scale().addTo(this.map)

      this.map.addLayer(new L.TileLayer("http://otile{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.jpg", {
        subdomains: "1234",
        type: "osm",
        attribution: "Map data Tiles &copy; <a href=\"http://www.mapquest.com/\" target=\"_blank\">MapQuest</a> <img src=\"http://developer.mapquest.com/content/osm/mq_logo.png\" />, Map data © OpenStreetMap contributors, CC-BY-SA",
        opacity: 0.7
      }))

      this.nodes = new NodesOverlayView({
        parent: this.map.getPanes().overlayPane,
        model: new Graph({
          stream: options.stream,
          map: this.map
        })
      })


      this.nodes.model.bounds.changes().take(1).map(function (b) {
        return [[b.x1, b.y1], [b.x2, b.y2]]
      }).onValue(this.map, "fitBounds")

      this.lat = options.lat || 0
      this.lon = options.lon || 0
      this.zoom = options.zoom || this.map.getMaxZoom()
      this.map.setView(L.latLng(this.lat, this.lon), this.zoom)
    },
    render: function () {
      this.$el.empty().append(this.$map)
      this.map.invalidateSize()
      this.nodes.render()
      return this
    }
  })

  var Menu = Backbone.View.extend({
    render: function () {
      this.$el.empty().append(
        $("<button>")
          .attr("id", "gpsbutton")
          .text("Koordinaten beim nächsten Klick anzeigen")
      )

      return this
    }
  })

  var mainView, menuView

  return {
    createMainView: function (options) {
      if (!mainView) mainView = new MainView(options)

      return mainView
    },
    createMenu: function (options) {
      if (!menuView) menuView = new Menu(options)

      return menuView
    },
    run: function () {
    }
  }
})
