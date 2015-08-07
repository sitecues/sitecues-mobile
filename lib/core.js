define(
    [
        'a',
        'b'
    ],
    function (a, b) {

        // The core module is the main entry point of our application.
        // It is responsible for loading any modules that are needed
        // right away, when we first load.

        console.log('a:', a);
        console.log('b:', b)

        // Make absolutely sure the sitecues namespace is ready to rock.
        var sitecues = window.sitecues = window.sitecues || {};
        sitecues.config = sitecues.config || {};

        var siteId = sitecues.config.siteId;
        console.log('Site ID:', siteId);


        // Do other stuff to set up our app...
    }
);
