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
      },
      "leaflet-css": {
        src: ["leaflet.css"],
        expand: true,
        cwd: "bower_components/leaflet/dist",
        dest: "build/css"
      }
    },
    uglify: {
      options: {
        sourceMap: true,
        sourceMapIncludeSources: true
      },
      libs: {
        src: [
          "bower_components/requirejs/require.js",
          "bower_components/bacon/dist/Bacon.js",
          "bower_components/d3/d3.js",
          "bower_components/leaflet/dist/leaflet-src.js",
          "bower_components/jquery/dist/jquery.js",
          "bower_components/jquery.tablesorter/js/jquery.tablesorter.js"
        ],
        expand: true,
        flatten: true,
        dest: "build/js/lib"
      },
      script: {
        src: ["config.js", "lib/*.js"],
        expand: true,
        flatten: true,
        dest: "build/js"
      }
    }
  })

  grunt.loadNpmTasks("grunt-contrib-copy")
  grunt.loadNpmTasks("grunt-contrib-uglify")
}
