'use strict';

module.exports = function (grunt) {
    grunt.config.merge({
        connect: {
            server: {
                options: {
                    base: 'build/', //TODO: once grunt-contrib-connect 0.9 is released, set index file
                    livereload: true
                }
            }
        }
    });
    grunt.config.merge({
        copy: {
            html: {
                options: {
                    process: function (content) {
                        return content
                            .replace('#cityname#', grunt.config('local.cityname'))
                            .replace('#sitename#', grunt.config('local.sitename'))
                            .replace('#url#', grunt.config('local.url'));
                    }
                },
                src: ['*.html'],
                expand: true,
                cwd: 'templates/',
                dest: 'build/'
            },
            images: {
                src: ['img/*.png', 'css/*.png'],
                expand: true,
                dest: 'build/'
            },
            css: {
                src: ['css/*.css'],
                expand: true,
                dest: 'build/'
            }
        }
    });
    grunt.config.merge({
        uglify: {
            options: {
                sourceMap: true,
                sourceMapIncludeSources: true
            },
            geomap: {
                src: [
                    'config.js',
                    'lib/loader.js',
                    'bower_components/d3/d3.js',
                    'lib/links.js',
                    'bower_components/leaflet/dist/leaflet-src.js',
                    'lib/html5slider.js',
                    'lib/geomap.js'
                ],
                dest: 'build/geomap_compiled.js'
            },
            graph: {
                src: [
                    'config.js',
                    'lib/loader.js',
                    'bower_components/d3/d3.js',
                    'lib/links.js',
                    'lib/pacman.js',
                    'lib/graph.js'
                ],
                dest: 'build/graph_compiled.js'
            },
            list: {
                src: [
                    'config.js',
                    'lib/loader.js',
                    'bower_components/d3/d3.js',
                    'lib/links.js',
                    'bower_components/jquery/dist/jquery.js',
                    'bower_components/jquery.tablesorter/js/jquery.tablesorter.js',
                    'lib/list.js'
                ],
                dest: 'build/list_compiled.js'
            },
            stats: {
                src: [
                    'config.js',
                    'lib/loader.js',
                    'lib/stats.js'
                ],
                dest: 'build/stats_compiled.js'
            }
        }
    });
    grunt.config.merge({
        watch: {
            sources: {
                options: {
                    livereload: true
                },
                files: ['{css,img}/*.png', 'css/*.css', 'lib/*.js', 'templates/*.html'],
                tasks: ['default']
            },
            config: {
                options: {
                    reload: true
                },
                files: ['Gruntfile.js'],
                tasks: []
            }
        }
    });
    grunt.config.merge({
        checkDependencies: {
            options: {
                install: true
            },
            bower: {
                options: {
                    packageManager: 'bower'
                }
            },
            npm: {}
        }
    });
    grunt.config.merge({
        local: grunt.file.readJSON('config.json')
    });
    grunt.config.merge({
        clean: {
            build: ['build/', '!build/nodes.json', 'node_modules/grunt-newer/.cache']
        }
    });

    grunt.loadNpmTasks('grunt-check-dependencies');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-newer');

    grunt.registerTask('default', ['checkDependencies', 'newer:copy', 'newer:uglify']);
    grunt.registerTask('dev', ['default', 'connect:server', 'watch']);
};
