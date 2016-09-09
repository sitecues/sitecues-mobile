/*
    build.js
    --------
    Tasks for compiling the library into a distributable format.
*/

'use strict';

// Helpers for disk I/O and other filesystem issues.
const fs = require('fs');
// Helpers for dealing with filesystem paths in a cross-platform way.
const pathUtil = require('path');
// r.js build optimizer, used to bundle up the library for best efficiency.
const optimizer = require('requirejs');

const path = {
    // This path is relative to this file itself.
    PREAMBLE   : pathUtil.join(__dirname, '..', 'preamble.js'),
    // This path is relative to the baseUrl set later.
    AMD_LOADER : pathUtil.join(__dirname, '..', 'node_modules', 'alameda', 'alameda')
};
// Our global namespace in the browser.
const namespace = 'sitecues';
// Here we store the names of modules we will need to refer to by name in
// other parts of the build configuration. Even though they look similar,
// module IDs are not paths. They are somewhat arbitrarily named
// references to specific modules.
const moduleId = {
    CORE       : 'core',
    AMD_LOADER : 'amdLoader'
};
// Specify where on disk a given module name can be found. This helps avoid
// naming modules based on their path and the confusion that causes.
const optimizerPaths = {};

optimizerPaths[moduleId.AMD_LOADER] = path.AMD_LOADER;

// A block of code to insert into the built file, which will tell our AMD
// loader how to behave at runtime. This is different than the build
// configuration given to the optimizer, although they may overlap.
let preamble;

// Callback for each file that the RequireJS optimizer (r.js) reads while it is
// tracing dependencies for our build.
// TODO: Figure out why the RequireJS optimizer r.js is calling
//       our onBuildRead callback twice for some files.
//       It doesn't seem to care about the return value the
//       first time around, but it does the second. Weird.
const onBuildRead = (moduleName, path, contents) => {
    // console.log('moduleName :', moduleName);
    // console.log('path       :', path);
    if (moduleName === moduleId.AMD_LOADER) {
        // Prepend our Alameda runtime configuration to Alameda itself,
        // so that we can use options like "skipDataMain" in it.
        // We also take the opportunity to prepend our sanity check,
        // because the optimizer gaurantees this will end up at the
        // top of the built file.
        return preamble + contents;
    }

    // console.log('This is onBuildRead:');
    // console.log('--------------------');
    // console.log('Number of arguments :', arguments.length);
    // console.log('Module name         :', moduleName);
    // console.log('Path                :', path);
    // console.log('Contents            :', contents);

    return contents;
};

const optimizerConfig = {
    // Directory to use as the basis for resolving most other relative paths.
    baseUrl : 'lib/js',
    // Path to write the final output to.
    dir : 'build',
    // Add the require() and define() functions as methods of our namespace,
    // to avoid conflicts with customer pages.
    namespace,
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
    fileExclusionRegExp : /README.md$/i,

    // When copying files from the source to the build dir,
    // skip any that have been put into a "modules" bundle.
    removeCombined : true,
    modules : [
        // The main entry point: sitecues.js
        {
            name   : namespace,
            create : true,
            skipModuleInsertion : true,
            // Add specific files or modules and their dependencies to the
            // built file.
            include : [
                // Add Alameda, our AMD module loader, so that we can load
                // code on-demand at runtime.
                moduleId.AMD_LOADER,
                // Add the main entry point of sitecues.
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
    onBuildRead,
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
        compress : {
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
};

const build = () => {
    preamble = fs.readFileSync(path.PREAMBLE, 'utf8');

    return new Promise((resolve, reject) => {
        optimizer.optimize(
            optimizerConfig,
            resolve,
            reject
        );
    });
};

module.exports = build;