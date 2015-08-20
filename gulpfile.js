'use strict';

var Promise       = require('bluebird'),  // Async helpers.
    // Utilities for dealing with filesystem paths in a cross-platform way.
    path          = require('path'),
    // Process manager for the testsite binary.
    pm2           = require('pm2'),
    pm2Connect    = Promise.promisify(pm2.connect, pm2),
    pm2Disconnect = Promise.promisify(pm2.disconnect, pm2),
    pm2Start      = Promise.promisify(pm2.start, pm2),
    pm2Reload     = Promise.promisify(pm2.reload, pm2),
    pm2Delete     = Promise.promisify(pm2['delete'], pm2),
    pm2LaunchBus  = Promise.promisify(pm2.launchBus, pm2),
    pm2DisconnectBus = Promise.promisify(pm2.disconnectBus, pm2),
    // TODO: We should really be doing browserSync.create() but it causes
    //       issues with listening to process events, which is serious.
    //       https://github.com/BrowserSync/browser-sync/issues/775
    browser       = require('browser-sync'),
    initBrowser   = Promise.promisify(browser.init, browser),
    gulp          = require('gulp'),  // Task runner.
    testsite      = require('./server'),
    TESTSITE_NAME = testsite.NAME,
    TESTSITE_BIN_PATH = testsite.BIN_PATH,
    TESTSITE_READY_MSG = testsite.READY_MSG;

function watchTestsite() {
    function onChange(event) {
        console.log('Changes detected in the testsite. Restarting it.');
        pm2Reload(TESTSITE_NAME)
            .then(
                function () {
                    // Inform all connected browsers that there are changes
                    // we want to display.
                    browser.reload(
                        function () {
                            console.log('Reloaded browsers.', arguments);
                        }
                    );
                }
            );

        // TODO: The reload() method can take a file path as an argument to
        //       help BrowserSync decide on the most efficient strategy for
        //       updating the page. We happen to know the full absolute
        //       path here, would it be useful to pass it along? Does it
        //       matter that it is absolute? It probably won't be absolute
        //       in the browser, so could this confuse BrowserSync?
        //       It might just trigger more complex code paths and slow
        //       things down.
        // var absolutePath = event.path;
        // browser.reload(absolutePath);
    }
    return pm2Connect()
        .then(
            function () {
                gulp.watch(
                        [
                            'server/**/*.*',   // Resources that make up the testsite.
                            TESTSITE_BIN_PATH  // The program that runs the testsite.
                        ]
                    )
                    .on('change', onChange);
            }
        );
}

function syncBrowsers() {
    return initBrowser(
            {
                proxy : 'localhost:3000',
                port  : 3001
            }
        )
        .then(
            watchTestsite
        );
}

function runTestsite() {
    return pm2Start(
            {
                name      : TESTSITE_NAME,      // Register a process by name.
                script    : TESTSITE_BIN_PATH,  // Code to run the testsite.
                exec_mode : 'cluster',          // Multiple instances allowed.
                instances : -1,                 // -1 means 1 short of CPU cores count
                max_memory_restart : '140M'     // Threshold to assume memory leakage.
            }
        );
}

// Helper for starting the testsite. PM2 gives us an event bus that enables
// communication between us and PM2 and, by extension, the testsite.
function waitForTestsiteInit(bus) {
    return new Promise(
            function (resolve, reject) {
                var resolved = false;
                // This event will fire for each instance of the tsstsite
                // created by PM2. Luckily, promises are immune to
                // calling resolve() multiple times.
                bus.on('process:msg', function (msg) {
                    if (msg === TESTSITE_READY_MSG) {
                        resolve();
                        resolved = true;
                    }
                });
                setTimeout(
                    function () {
                        if (!resolved) {
                            console.warn(
                                'The testsite is taking a long time to start.'
                            );
                        }
                    },
                    1500
                );
            }
        );
}

function startTestsite() {
    return pm2Connect()
        .then(
            runTestsite
        )
        .then(
            function () {
                return pm2LaunchBus();
            }
        )
        .then(
            waitForTestsiteInit
        )
        .then(
            function () {
                return pm2DisconnectBus();
            }
        )
        .then(
            function () {
                return pm2Disconnect();
            }
        );
}

function killTestsite() {
    return pm2Delete(TESTSITE_NAME);
}

function stopTestsite() {
    return pm2Connect()
        .then(
            killTestsite
        )
        // Users may forget the state of the testsite or it might be shut down
        // by external forces. If it is not running when we try to kill it,
        // the process manager will throw an error. But its not worth an
        // ugly stack trace to the face.
        .catch(
            function (err) {
                if (err.msg === 'process name not found') {
                    console.log('The testsite doesn\'t seem to be running. Nothing to do.');
                    return;
                }
                else {
                    throw err;
                }
            }
        )
        // Always disconnect from the process manager, otherwise it will leave
        // the process open forever, since it is a daemon.
        .finally(
            function () {
                return pm2Disconnect();
            }
        )
}

// Register tasks, so that Gulp understands what to do by name.

// For lazy people.
gulp.task('serve', startTestsite);
// For people that prefer symmetry over laziness.
gulp.task('start-testsite', startTestsite);
gulp.task(syncBrowsers);
gulp.task('stop-testsite', stopTestsite);

var dev = gulp.series(
    startTestsite,
    syncBrowsers
);

// For the lazy who still want to be explicit.
gulp.task('dev', dev);

// Our default task. Run when "gulp" is called with no task names.
gulp.task(
    'default',
    dev
);
