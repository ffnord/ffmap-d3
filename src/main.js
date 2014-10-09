define("main", [
  "jquery",
  "underscore",
  "lib/backbone",
  "loader",
  "config"
], function ($, _, Backbone, loadNodes, ffmapConfig) {
  "use strict"

  var apps = new Backbone.Collection([/*{
    title: "Graph",
    target: "graph",
    dependecies: ["graph"]
  }, */{
    title: "Karte",
    target: "geomap",
    dependencies: ["geomap"]
  }/*, {
    title: "Liste",
    target: "list",
    dependencies: ["list"]
  }*/])

  var graph = loadNodes(ffmapConfig)

  function getQueryParams(query) {
    query = query || ""
    var params = {}
    query.split("&").forEach(function (pair) {
        var tmp = pair.split("=")
        params[tmp[0]] = decodeURIComponent(tmp[1])
      })
    return params
  }

  var MainRouter = Backbone.Router.extend({
    routes: {
      ":target": "openApp"
    },
    openApp: function (target, query) {
      require([target + "/main"], function (app) {
        var params = getQueryParams(query)
        if (app.createMainView)
          app.createMainView(_.extend({
            el: ".container",
            model: graph
          }, params)).render()

        if (app.createMenu)
          app.createMenu(_.extend({
            el: "#appMenu"
          }, params)).render()

        if (app.run) app.run()
      })
    }
  })
  var router = new MainRouter()
  Backbone.history.start()

  var MainMenuList = Backbone.View.extend({
    el: "#mainMenu",
    addItem: function (model) {
      this.$list.append(
        $("<li>").append(
          $("<a>")
            .attr("href", "#")
            .text(model.get("title"))
            .click(function (e) {
              e.preventDefault()
              router.navigate(model.get("target"), { trigger: true })
            })
        )
      )
    },
    render: function () {
      this.$el.empty().append(this.$list = $("<ul>"))

      this.collection.map(this.addItem.bind(this))

      return this
    }
  })

  var mainMenu = new MainMenuList({
    collection: apps
  })

  mainMenu.render()

  return {
    router: router
  }
})
