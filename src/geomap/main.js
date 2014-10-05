define("geomap/main", [
  "jquery",
  "lib/backbone",
  "lib/leaflet-src",
  "lib/d3"
], function ($, Backbone, L) {
  "use strict"

  var NodesOverlayView = Backbone.View.extend({
    tagName: "svg",
    initialize: function (options) {
      if (options.parent) $(options.parent).append(this.$el)
    },
    render: function () {
      var g = $("<g>").addClass("leaflet-zoom-hide")
      g.append(
        $("<g>").addClass("links"),
        $("<g>").addClass("labels"),
        $("<g>").addClass("nodes")
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
        model: options.model || []
      })

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
