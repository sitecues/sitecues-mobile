define(
    [
        'jquery'  // the "real" jquery
    ],
    function ($) {

        // This module is an abstraction of jquery so that we
        // can customize it as needed.

        // Return all jQuery-related global variables to
        // their original state. We need to be tidy!
        return $.noConflict(true);
    }

);
