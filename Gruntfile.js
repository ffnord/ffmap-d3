"use strict"

module.exports = function (grunt) {
  grunt.config.merge({
    local: grunt.file.readJSON("config.json")
  })

  grunt.loadTasks("tasks")

  grunt.loadNpmTasks("grunt-newer")

  grunt.registerTask("default", ["checkDependencies", "newer:copy", "newer:uglify"])
  grunt.registerTask("dev", ["default", "connect:server", "watch"])
}
