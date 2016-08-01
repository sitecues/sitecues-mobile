'use strict';

// Pretty print JSON objects as strings.
const jsonAlign = require('json-align');
const pkg = require('../../package.json');

const appName = pkg.name + '-testsite';
const appVersion = pkg.version;

module.exports = {
    method  : 'GET',
    path    : '/status',
    handler(request, reply) {
        const status = {
            app        : appName,
            version    : appVersion,
            statusCode : 200,
            status     : 'OK',
            time       : (new Date()).toISOString(),
            process    : {
                title   : process.title,
                version : process.version,
                pid     : process.pid,
                uptime  : process.uptime()
            }
        };

        reply(jsonAlign(status))
        // Inform Hapi that our string is actually valid JSON.
        .type('application/json');
    }
};
