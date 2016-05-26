/*
    lib-setup.js
    ------------

    This file is the first piece of code to run with the initial download
    of sitecues. It ensures that our namespace is setup properly and then
    configures Alameda, our AMD module loader,

    Alameda is similar to RequireJS and even uses the same namespace.
    We prepend this file to Alameda itself at build time.
*/

if (!window.sitecues || typeof window.sitecues !== 'object') {
    window.sitecues = {};
}

var sitecues = window.sitecues;

if (!sitecues.config || typeof sitecues.config !== 'object') {
    sitecues.config = {};
}

if (!sitecues.config.siteId) {
    sitecues.config.siteId = '';
}

if (!sitecues.config.scriptUrl) {
    sitecues.config.scriptUrl = '';
}

/*
    IMPORTANT SECURITY NOTE:
    Please ensure that the following assignment occurs immediately
    before any RequireJS-based AMD loader we may use. If not, it
    could lead to customers gaining control of our loader config,
    For details, see: https://github.com/jrburke/r.js/issues/843
*/

// NOTE: This variable name is special. Alameda looks for this to decide if
//       configuration has been declared prior to it running.
var require = {
    // Tell Alameda to never search for or execute a script with a "data-main"
    // attribute, since this could have weird consequences on customer pages.
    skipDataMain : true,
    // Make aliases to modules, for convenience.
    map : {
        // All modules get 'jquery-private' when they ask for 'jquery',
        // so that we can secretly return a customized value which
        // implements .noConflict() to avoid puking on customers.
        '*' : {
            jquery : 'jquery-private'
        },
        // Treat 'jquery-private' as a special case and allow it to access
        // the "real" jQuery module. Without this, there would be an
        // unresolvable cyclic dependency.
        'jquery-private' : {
            jquery : 'jquery'
        }
    }
};
