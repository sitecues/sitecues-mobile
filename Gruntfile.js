// This file defines the specification for our build system.

'use strict';

var // This path is relative to this file itself.
    AMD_LOADER_CONFIG_PATH = './lib/require-config.js',
    // This path is relative to the baseUrl set later.
    AMD_LOADER_PATH = '../node_modules/alameda/alameda',
    // Our global namespace in the browser.
    NAMESPACE       = 'sitecues',
    // File system helper utilities.
    fs              = require('fs'),
    amdLoaderConfig,
    pathsConfig = {},
    moduleId    = {
        CORE       : 'core',
        AMD_LOADER : 'amdLoader'
    };

pathsConfig[moduleId.AMD_LOADER] = AMD_LOADER_PATH;

// Callback for each file that the RequireJS optimizer (r.js)
// reads while its tracing dependencies for our build.
function onBuildRead(moduleName, path, contents) {

    // TODO: Figure out why the RequireJS optimizer r.js is calling
    //       our onBuildRead callback twice for each file.
    //       It doesn't seem to care about the return value the
    //       first time around, but it does the second. Weird.

    // By default, assume we don't want to modify the file.
    var result = contents;
    console.log('moduleName:', moduleName);
    if (moduleName === moduleId.AMD_LOADER) {
        amdLoaderConfig = fs.readFileSync(AMD_LOADER_CONFIG_PATH, 'utf8');
        // Prepend our Alameda runtime configuration to Alameda itself,
        // so that we can use options like "skipDataMain" in it.
        result = amdLoaderConfig + result;
    }

    // console.log('This is onBuildRead:');
    // console.log('--------------------');
    // console.log('Number of arguments :', arguments.length);
    // console.log('Module name         :', moduleName);
    // console.log('Path                :', path);
    // console.log('Contents            :', contents);

    return result;
}

function taskRunner(grunt) {

    // TODO: Consider using AMDclean in the build process to make the initial download smaller.

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

            // concat : {

            // },

            requirejs : {
                core : {
                    options : {
                        // Directory to use as the basis for resolving most other relative paths.
                        baseUrl : "lib",
                        // Module that starts the dependency graph.
                        name    : moduleId.CORE,
                        // Path to write the final output to.
                        out : 'build/sitecues.js',
                        // Add the require() and define() functions as methods of our namespace,
                        // to avoid conflicts with customer pages.
                        namespace : NAMESPACE,

                        // Describe folders (and optionally, their "main" file)
                        packages : [
                            'ui',
                            'audio'
                        ],

                        // Tell the optimizer where certain modules can be found on disk,
                        // in cases where it has no other way to figure that out.
                        // Without this, the paths would have to be used as Module IDs
                        // and that is just ugly and not fun.
                        paths : pathsConfig,
                        // At the end of the built file, trigger these modules.
                        insertRequire : [
                            moduleId.CORE
                        ],
                        // Add other files or modules to the build, which are not listed
                        // as dependencies of the main entry point.
                        include : [
                            // Add Alameda, our AMD module loader, so that we can load
                            // code on-demand at runtime.
                            moduleId.AMD_LOADER
                        ],
                        // Run a callback for each file in the build, so that we can modify it
                        // before it gets written to disk.
                        onBuildRead : onBuildRead,

                        // TODO: We probably want to add lib/namespace.js with onBuildWrite

                        // Prevent the optimizer from creating empty stub modules for files that
                        // are included in the build, but don't call define() by themselves.
                        skipModuleInsertion: true,
                        // Choose a tool to minify the build.
                        optimize : 'none',
                        // Configure the Uglify2 minifer. These are only applied if this
                        // tool is in use by the "optimize" option.
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
    // grunt.loadNpmTasks('grunt-contrib-concat');
    // Load the plugin that provides the "requirejs" task.
    grunt.loadNpmTasks('grunt-contrib-requirejs');

    // Make a new task called "build".
    grunt.registerTask('build', ['requirejs:core']);

    // Default task, will run if no task is specified.
    grunt.registerTask('default', ['clean', 'build']);

};

module.exports = taskRunner;
