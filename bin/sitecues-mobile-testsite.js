'use strict';

const testsite = require('../server');

let cancelled = false;

process.on('SIGINT', () => {

    if (cancelled) {
        console.warn('\nShutting down immediately. You monster!');
        process.exit(1);
    }

    cancelled = true;

    console.warn('\nShutting down. Please wait or hit CTRL+C to force quit.');

    testsite.stop();
});

testsite.start().then(() => {
    // Tell the master process managing us that the testsite is ready.
    // We do this so that programs can launch it indirectly and still
    // be notified when it is okay to run code that depends upon the
    // testsite being ready.
    process.send(testsite.READY_MSG);
});
