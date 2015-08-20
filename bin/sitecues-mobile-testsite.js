var testsite = require('../server'),
    READY_MSG = testsite.READY_MSG;

testsite.start()
    .then(
        function () {
            // Tell the master process managing us that the testsite is ready.
            // We do this so that programs can launch it indirectly and still
            // be notified when it is okay to run code that depends upon the
            // testsite being ready.
            process.send(READY_MSG);
        }
    );
