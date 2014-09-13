"use strict"

module.exports = function(grunt) {
  grunt.config.merge({
    copy: {
      html: {
        options: {
          process: function (content) {
            return content
              .replace("#cityname#", grunt.config("local.cityname"))
              .replace("#sitename#", grunt.config("local.sitename"))
              .replace("#url#", grunt.config("local.url"))
          }
        },
        src: ["*.html"],
        expand: true,
        cwd: "templates/",
        dest: "build/"
      },
      resources: {
        src: ["img/*.png", "css/*.png", "lib/*.wav"],
        expand: true,
        dest: "build/"
      },
      css: {
        src: ["css/*.css"],
        expand: true,
        dest: "build/"
      }
    },
    uglify: {
      options: {
        sourceMap: true,
        sourceMapIncludeSources: true
      },
      geomap: {
        src: [
          "config.js",
          "lib/loader.js",
          "bower_components/d3/d3.js",
          "lib/links.js",
          "bower_components/leaflet/dist/leaflet-src.js",
          "lib/geomap.js"
        ],
        dest: "build/geomap.js"
      },
      graph: {
        src: [
              "config.js",
              "lib/loader.js",
              "bower_components/d3/d3.js",
              "lib/links.js",
              "lib/pacman.js",
              "lib/graph.js"
        ],
        dest: "build/graph.js"
      },
      list: {
        src: [
        "config.js",
        "lib/loader.js",
          "bower_components/d3/d3.js",
          "lib/links.js",
          "bower_components/jquery/dist/jquery.js",
          "bower_components/jquery.tablesorter/js/jquery.tablesorter.js",
            "lib/list.js"
        ],
        dest: "build/list.js"
      }
    }
  })

  grunt.loadNpmTasks("grunt-contrib-copy")
  grunt.loadNpmTasks("grunt-contrib-uglify")
}
