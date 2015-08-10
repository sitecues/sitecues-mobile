// This file sets up the configuration for Alameda, our AMD module loader.
// Alameda is similar to RequireJS and even uses the same namespace.
// We prepend this to Alameda itself at build time.

// IMPORTANT SECURITY NOTE:
//    Please ensure that the following assignment occurs immediately
//    before any RequireJS-based AMD loader we may use. If not, it
//    could lead to customers gaining control of our loader config,
//    For details, see: https://github.com/jrburke/r.js/issues/843

// NOTE: This variable name is special. Alameda looks for this to decide if
//       configuration has been declared prior to it running.
var require = {
    // Tell Alameda to expose the Promises/A+ interface it uses internally,
    // so that we don't have to download another one.
    definePrim : 'Promise',
    // Tell Alameda to never search for or execute a script with a "data-main"
    // attribute, since this could have weird consequences on customer pages.
    skipDataMain : true,
    // Make aliases to modules, for convenience.
    map: {
        // All modules get 'jquery-private' when they ask for 'jquery',
        // so that we can secretly return a customized value which
        // implements .noConflict() to avoid puking on customers.
        '*': {
            'jquery': 'jquery-private'
        },
        // Treat 'jquery-private' as a special case and allow it to access
        // the "real" jQuery module. Without this, there would be an
        // unresolvable cyclic dependency.
        'jquery-private': {
            'jquery': 'jquery'
        }
    }
};
