// This module is an abstraction of jquery so that we
// can customize it as needed.
define(
    [
        // The "real" jquery.
        'jquery'
    ],
    ($) => {
        // Return all jQuery-related global variables to
        // their original state. We need to be tidy!
        return $.noConflict(true);
    }
);
