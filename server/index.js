'use strict';

const
    // Server framework.
    hapi       = require('hapi'),
    // Templating engine.
    handlebars = require('handlebars'),
    // Application metadata.
    pkg        = require('../package.json'),
    // Cross-platform utilities for resolving and normalizing paths.
    path       = require('path'),
    // Pretty print JSON objects as strings.
    jsonAlign  = require('json-align'),
    // Process management.
    pm2        = require('pm2'),
    APP_NAME   = pkg.name + '-testsite',
    VERSION    = pkg.version,
    server     = new hapi.Server(),
    _start     = server.start.bind(server);

// The grunt-hapi plugin we currently use expects to be able to call start() on
// our exported Hapi instance. Problem is, we shouldn't start until after all
// plugins like our templating system are completely done loading, which is
// asynchronous. We solve that here by encapsulating that functionality and
// overriding the start() method.
function doStart(resolve, reject) {

    function onStart(err) {

        if (err) {
            reject(err);
            return;
        }

        console.log('Server running at: ' + server.info.uri);
        // Signal to the outside world that the server is ready and listening.
        resolve(server.info.uri);
    }

    // Code to run when plugins are finished being set up.
    function onPluginsReady(err) {

        if (err) {
            // Unable to load plugins that we need, so don't even try to continue.
            reject(err);
            return;
        }

        // Use the views plugin we registered with the server
        // to configure how it will display content.
        server.views({
            engines : {
                html : handlebars
            },
            relativeTo   : path.join(__dirname, 'view'),
            path         : './',
            // Name of the default layout file. Can be overriden in routes.
            layout       : 'default-layout',
            // Directory name where layouts are stored.
            layoutPath   : 'layout',
            // Directory name where partials are stored.
            partialsPath : 'partial',
            // Directory name where helpers are stored.
            helpersPath  : 'helper'
        });

        // Tell Hapi to begin listening on the configured hostname(s) and port(s).
        _start(onStart);
    }

    console.log('Testsite starting.');

    // Setup plugins to extend Hapi's functionality.
    server.register(
        [
            // Static file serving.
            require('inert'),
            // View templating.
            require('vision')
        ],
        // Code to run when all plugins are loaded.
        onPluginsReady
    );
}

function start() {
    return new Promise(doStart);
}

// Setup a virtual server instance.
server.connection({ port : 3000 });

// Add publicly available routes.
server.route({
    method  : 'GET',
    path    : '/',
    handler : function (request, reply) {
       reply.view('index');
    }
});

server.route({
    method  : 'GET',
    path    : '/status',
    handler : function (request, reply) {

        const status = {
            app        : APP_NAME,
            version    : VERSION,
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
});

server.route({
    method  : 'GET',
    path    : '/sitecues-symbol.png',
    handler : function (request, reply) {
        reply.file(
            path.join(__dirname, 'store/sitecues-symbol.png')
        );
    }
});

server.start = start;

server.NAME  = APP_NAME;
// Project root relative path to the binary that runs the testsite.
server.BIN_PATH = pkg.bin[APP_NAME];
// Define a signal that dependants should emit or listen for
// when determining testsite readiness.
server.READY_MSG = APP_NAME + ' is ready';

module.exports = server;
