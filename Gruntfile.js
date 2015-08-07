'use strict';

var NAMESPACE = 'sitecues';

function taskRunner(grunt) {

    // Task configuration.
    grunt.initConfig(
        {
            // Getting the full node app configuration as an object
            // which can be used internally.
            pkg : grunt.file.readJSON('package.json'),

            // Clean configuration, used to wipe out temporary build data,
            // for more robust and reliable builds.
            clean : {
                // options : {
                // //    'no-write': true  // this does a dry-run (logs but no actual file deletion)
                // },
                normal : {
                    src : [
                        'report',  // directory created by the test system
                        'build'    // directory created by the build system
                    ]
                }
            },

            // Watch configuration, used for automatically executing
            // tasks when saving files in the library.
            watch : {
                files : ['**.*'],
                tasks : ['clean', 'build']
            },

            concat : {
                setup : {
                    src  : ['lib/namespace.js', 'lib/require-config.js', 'node_modules/alameda/alameda.js', 'lib/require-hooks.js'],
                    dest : 'build/setup.js'
                },
                sitecues : {  // NOTE: core.js comes from requirejs
                    src  : ['build/setup.js', 'build/core.js'],
                    dest : 'build/sitecues.js'
                }
            },
            requirejs : {
                core : {
                    options : {
                        // Directory to use as the basis for resolving most other relative paths.
                        baseUrl : "lib",
                        // Module that starts the dependency graph.
                        name    : 'core-amd',
                        //create : true,
                        // Path to write the final output to.
                        out : 'build/core.js',
                        // Add the require() and define() functions as methods of our namespace,
                        // to avoid conflicts with customer pages.
                        namespace : NAMESPACE,
                        optimize : 'none',
                        uglify2: {
                            // Example of a specialized config. If you are fine
                            // with the default options, no need to specify
                            // any of these properties.
                            output: {
                                beautify: true
                            },
                            compress: {
                                sequences: false,
                                global_defs: {
                                    DEBUG: false
                                }
                            },
                            warnings: true,
                            mangle: false
                        }
                    }
                }
            }
        }
    );
    // Load the plugin that provides the "clean" task.
    grunt.loadNpmTasks('grunt-contrib-clean');
    // Load the plugin that provides the "watch" task.
    grunt.loadNpmTasks('grunt-contrib-watch');
    // Load the plugin that provides the "concat" task.
    grunt.loadNpmTasks('grunt-contrib-concat');
    // Load the plugin that provides the "requirejs" task.
    grunt.loadNpmTasks('grunt-contrib-requirejs');

    // Make a new task called "build".
    // grunt.registerTask('build', ['concat:core', 'concat:base', 'concat:sitecues'])
    grunt.registerTask('build', ['concat:setup', 'requirejs:core', 'concat:sitecues']);

    // Default task, will run if no task is specified.
    grunt.registerTask('default', ['clean', 'build']);

};

module.exports = taskRunner;
