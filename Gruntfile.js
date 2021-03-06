var ext = require('./.gruntExt')
module.exports = function (grunt) {
    'use strict';

    // Setup paths
    ext.configure({
        path: {
            src: 'src',
            dist: 'dist',
            build: 'build'
        }
    });

    // Cleanup
    ext.configure({
        clean: {
            dist: ['<%= path.dist %>/*']
        }
    });

    // Typescript source compile
    ext.configure({
        typescript: {
            scripts: {
                src: ['<%= path.src %>/**/*.ts'],
                dest: '<%= path.build %>',
                options: {
                    module: 'amd',
                    target: 'es3',
                    basePath: '<%= path.src %>',
                    sourceMap: true,
                    declaration: true,
                    comments: true
                }
            }
        },
        watch: {
            scripts: {
                files: ['<%= path.src %>/**/*.ts'],
                tasks: ['build'],
                options: { spawn: true }
            }
        }
    });
    ext.registerTask('scripts', ['typescript:scripts']);

    // Sass source compile
    ext.configure({
        sass: {
            styles: {
                files: [{
                    cwd: '<%= path.src %>',
                    expand: true,
                    src: ['*.scss'],
                    dest: '<%= path.dist %>',
                    ext: '.css'
                }]
            }
        },
        watch: {
            styles: {
                files: ['<%= path.src %>/**/*.scss'],
                tasks: ['build'],
                options: { spawn: true }
            }
        }
    });
    ext.registerTask('styles', ['sass:styles']);

    // Build tasks for release
    ext.configure({
        uglify: {
            build: {
                files: {
                    '<%= path.dist %>/gallery.min.js': ['<%= path.build %>/gallery.js'],
                    '<%= path.dist %>/modal.min.js': ['<%= path.build %>/modal.js']
                }
            }
        },
        copy: {
            build: {
                files: {
                    '<%= path.dist %>/gallery.js': ['<%= path.build %>/gallery.js'],
                    '<%= path.dist %>/modal.js': ['<%= path.build %>/modal.js'],
                }
            }
        }
    });
    ext.registerTask('build', ['scripts', 'styles', 'copy:build', 'uglify:build']);

    // Local tests
    ext.configure({
        connect: {
            gallery: {
                options: {
                    port: 3008,
                    base: '.'
                }
            }
        }
    });
    ext.registerTask('server', ['connect:gallery', 'watch']);

    ext.initConfig(grunt);
    grunt.registerTask('default', ['clean', 'build']);
};
