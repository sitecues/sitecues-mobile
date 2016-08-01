#!/usr/bin/env node

'use strict';

require('throw-rejects/register');

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

const ready = testsite.start();

// Tell the master process managing us that the testsite is ready.
// We do this so that programs can launch it indirectly and still
// be notified when it is okay to run code that depends upon the
// testsite being ready.
if (typeof process.send === 'function') {
    ready.then(() => {
        process.send(testsite.READY_MSG);
    });
}
