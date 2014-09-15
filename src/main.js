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

  var MainRouter = Backbone.Router.extend({
    routes: {
      ":target": "openApp"
    },
    openApp: function (target) {
      require([target + "/main"], function (app) {
        if (app.createMainView)
          app.createMainView({
            el: ".container",
            model: graph
          }).render()

        if (app.createMenu)
          app.createMenu({
            el: "#appMenu"
          }).render()

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
