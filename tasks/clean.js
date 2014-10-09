"use strict"

module.exports = function (grunt) {
  grunt.config.merge({
    clean: {
      build: ["build/**/*", "!build/nodes.json", "node_modules/grunt-newer/.cache"]
    }
  })

  grunt.loadNpmTasks("grunt-contrib-clean")
}
