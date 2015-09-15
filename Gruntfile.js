/*
    Gruntfile.js
    ------------
    The build system for our application.
*/

'use strict';

var // Helpers for cross-platform compliance.
    path            = require('path'),
    // This path is relative to this file itself.
    PREAMBLE_PATH   = path.join(__dirname, 'preamble.js'),
    // This path is relative to the baseUrl set later.
    AMD_LOADER_PATH = path.join(__dirname, 'node_modules/alameda/alameda'),
    // Our global namespace in the browser.
    NAMESPACE       = 'sitecues',
    // File system helper utilities.
    fs              = require('fs'),
    // A block of code to insert into sitecues.js, which will sanitize our
    // public namespace and tell our AMD loader how to behave at runtime.
    // This is different than the build configuration given to the
    // optimizer, although they may overlap.
    preamble = fs.readFileSync(PREAMBLE_PATH, 'utf8'),
    // Specify where on disk a given module name can be found. This helps avoid
    // naming modules based on their path and the confusion that causes.
    optimizerPaths = {
        // Tell the optimizer it doesn't need to try to find "Promise", because
        // that is a special module ID set in the configuration for Alameda,
        // which asks it to expose its internal implementation of "prim".
        // In other words, if Alameda is bundled, so is "Promise".
        'Promise' : 'empty:'
    },
    // Even though they look similar, Module IDs are not paths. Here we store
    // the names of modules we will need to refer to by name in other parts
    // of the build configuration.
    moduleId    = {
        CORE       : 'core',
        AMD_LOADER : 'amdLoader'
    };

optimizerPaths[moduleId.AMD_LOADER] = AMD_LOADER_PATH;

// Callback for each file that the RequireJS optimizer (r.js) reads while it is
// tracing dependencies for our build.
function onBuildRead(moduleName, path, contents) {

    // TODO: Figure out why the RequireJS optimizer r.js is calling
    //       our onBuildRead callback twice for some files.
    //       It doesn't seem to care about the return value the
    //       first time around, but it does the second. Weird.

    // By default, assume we don't want to modify the file.
    var result = contents;
    console.log('moduleName:', moduleName);
    if (moduleName === moduleId.AMD_LOADER) {
        // Prepend our Alameda runtime configuration to Alameda itself,
        // so that we can use options like "skipDataMain" in it.
        // We also take the opportunity to prepend our sanity check,
        // because the optimizer gaurantees this will end up at the
        // top of the built file.
        result = preamble + result;
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
            // Get the full configuration for our app as an object
            // which can be used internally in template strings.
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
                // The "core" task bundles the files needed to initialize the
                // application for first use. Other modules or bundles may be
                // downloaded on-demand at runtime.
                core : {
                    options : {
                        // Directory to use as the basis for resolving most other relative paths.
                        baseUrl : "lib/js",
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
                        paths : optimizerPaths,
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

                        // TODO: Figure out expected behavior of useStrict
                        // useStrict : true,

                        // Prevent the optimizer from creating empty stub modules for files that
                        // are included in the build, but don't call define() by themselves.
                        skipModuleInsertion : true,
                        // Output a source map file, which tells the browser
                        // how to pretend the built file is not minified
                        // when developer tools are used.
                        generateSourceMaps : true,
                        // Scan for code comments containing license info
                        // and try to keep them from being removed during
                        // the minification process. This is not
                        // supported when using source maps.
                        preserveLicenseComments : false,
                        // Choose a tool to minify the build.
                        optimize : 'none',
                        // Configure the Uglify2 minifer. These are only applied if this
                        // tool is in use by the "optimize" option.
                        uglify2 : {
                            output : {
                                beautify : false
                            },
                            mangle   : true,
                            warnings : true,
                            compress: {
                                booleans      : true,
                                cascade       : true,
                                comparisons   : true,
                                conditionals  : true,
                                dead_code     : true,
                                drop_debugger : true,
                                evaluate      : true,
                                hoist_funs    : true,
                                hoist_vars    : true,
                                if_return     : true,
                                join_vars     : true,
                                loops         : true,
                                negate_iife   : true,
                                properties    : true,
                                sequences     : true,
                                unused        : true,

                                drop_console  : false,
                                keep_fargs    : false,
                                keep_fnames   : false,
                                pure_funcs    : false,
                                pure_getters  : false,
                                unsafe        : false
                            }
                        }
                    }
                },
                core2 : {
                    options : {
                        // Directory to use as the basis for resolving most other relative paths.
                        baseUrl : 'lib/js',
                        // Path to write the final output to.
                        dir : 'build',
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
                        paths : optimizerPaths,

                        // TODO: Figure out expected behavior of useStrict.
                        //       Docs claim it "allows" using 'use strict',
                        //       but it doesn't seem to matter in practice.
                        // useStrict : true,

                        // When copying source files to the build directory, ignore any that match
                        // this pattern. We ignore README files for convenience, so that you can
                        // make use of them without dirtying the build.
                        fileExclusionRegExp: /README.md$/i,

                        // When copying files from the source to the build dir,
                        // skip any that have been put into a "modules" bundle.
                        removeCombined : true,
                        fileExclusionRegExp: /README.md$/i,
                        modules : [
                            // The main entry point: sitecues.js
                            {
                                // Add Alameda, our AMD module loader, so that we can load
                                // code on-demand at runtime.
                                name   : NAMESPACE,
                                create : true,
                                skipModuleInsertion : true,
                                // Add specific files or modules and their dependencies to the
                                // built file.
                                include : [
                                    moduleId.AMD_LOADER,
                                    moduleId.CORE
                                ],
                                // At the end of the built file, execute these modules.
                                insertRequire : [
                                    moduleId.CORE
                                ]
                            }
                        ],

                        // Run a callback for each file in the build, so that we can modify it
                        // before it gets written to disk.
                        onBuildRead : onBuildRead,
                        // Prevent the optimizer from creating empty stub modules for files that
                        // are included in the build, but don't call define() by themselves.
                        skipModuleInsertion : true,
                        // Output a source map file, which tells the browser
                        // how to pretend the built file is not minified
                        // when developer tools are used.
                        generateSourceMaps : true,
                        // Scan for code comments containing license info
                        // and try to keep them from being removed during
                        // the minification process. This is not
                        // supported when using source maps.
                        preserveLicenseComments : false,
                        // Choose a tool to minify the build.
                        optimize : 'none',
                        // Configure the Uglify2 minifer. These are only applied if this
                        // tool is in use by the "optimize" option.
                        uglify2 : {
                            output : {
                                beautify : false
                            },
                            mangle   : true,
                            warnings : true,
                            compress: {
                                booleans      : true,
                                cascade       : true,
                                comparisons   : true,
                                conditionals  : true,
                                dead_code     : true,
                                drop_debugger : true,
                                evaluate      : true,
                                hoist_funs    : true,
                                hoist_vars    : true,
                                if_return     : true,
                                join_vars     : true,
                                loops         : true,
                                negate_iife   : true,
                                properties    : true,
                                sequences     : true,
                                unused        : true,

                                drop_console  : false,
                                keep_fargs    : false,
                                keep_fnames   : false,
                                pure_funcs    : false,
                                pure_getters  : false,
                                unsafe        : false
                            }
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

    grunt.registerTask('build2', ['requirejs:core2']);

    // Make a new task called "build".
    grunt.registerTask('dev', ['build']);

    // Default task, will run if no task is specified.
    grunt.registerTask('default', ['clean', 'build']);

};

module.exports = taskRunner;
