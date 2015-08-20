var // Server framework.
    hapi       = require('hapi'),
    // Templating engine.
    handlebars = require('handlebars'),
    // Application metadata.
    pkg        = require('../package.json'),
    // Cross-platform utilities for resolving and normalizing paths.
    path       = require('path'),
    // Hapi plugin for serving static content.
    inert      = require('inert'),
    // Hapi plugin for managing dynamic templates.
    vision     = require('vision'),
    // Pretty print JSON objects as strings.
    jsonAlign  = require('json-align'),
    // Process management.
    pm2        = require('pm2'),
    APP_NAME   = pkg.name + '-testsite',
    VERSION    = pkg.version,
    server     = new hapi.Server(),
    _start     = server.start.bind(server),
    _stop      = server.stop.bind(server),
    status = {
        app        : APP_NAME,
        version    : VERSION,
        statusCode : 200,
        status     : 'OK'
    };

Object.defineProperty(
    status,
    'time',
    {
        enumerable : true,
        get        : function () {
            return (new Date()).toISOString();
        }
    }
);

status.process = {
    title   : process.title,
    version : process.version,
    pid     : process.pid,
};

Object.defineProperty(
    status.process,
    'uptime',
    {
        enumerable : true,
        get        : process.uptime
    }
);

// The grunt-hapi plugin we currently use expects to be able to call start() on
// our exported Hapi instance. Problem is, we shouldn't start until after all
// plugins like our templating system are completely done loading, which is
// asynchronous. We solve that here by encapsulating that functionality and
// overriding the start() method.
function doStart(resolve, reject) {

    // Code to be run when the server begins listening (or fails to).
    function onStart(err) {
        if (err) {
            // Server was unable to start.
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
        server.views(
            {
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
            }
        );

        // Tell Hapi to begin listening on the configured hostname(s) and port(s).
        _start(onStart);
    }

    console.log('Testsite starting.');

    // Setup plugins to extend Hapi's functionality.
    server.register(
        [
            // View templates.
            {
                register : vision,
                options  : {

                }
            },
            // Static file serving.
            {
                register : inert,
                options  : {

                }
            }
        ],
        // Code to run when all plugins are loaded.
        onPluginsReady
    );
}

function start() {
    return new Promise(doStart);
}

function stop() {

    // Support passing an arbitrary number of arguments down the
    // low-level Hapi server API.
    var args = Array.prototype.slice.call(arguments);

    function doStop(resolve, reject) {
        // Code to be run when the server stops listening (or fails to).
        function onStop(err) {
            if (err) {
                // Server was unable to stop.
                reject(err);
                return;
            }
            resolve();
        }

        // Because we return a promise, it is expected that the user will
        // not give us a callback. But we give one to Hapi to tell us
        // when the server is ready. If the user give us a callback,
        // this will not work, since Hapi will only care about the
        // first function provided to it.
        args.push(onStop);

        _stop.apply(undefined, args);
    }

    return new Promise(doStop);
}

// Setup a virtual server instance.
server.connection(
    {
        host: 'localhost',
        port: 3000
    }
);

// Add publicly available routes.
server.route(
    {
        method  : 'GET',
        path    : '/',
        handler : function (request, reply) {
           reply.view('index');
        }
    }
);

server.route(
    {
        method  : 'GET',
        path    : '/status',
        handler : function (request, reply) {
            reply(
                jsonAlign(status)
            )
            // Inform Hapi that our string is actually valid JSON.
            .type(
                'application/json'
            );
        }
    }
);

server.route(
    {
        method  : 'GET',
        path    : '/sitecues-symbol.png',
        handler : function (request, reply) {
            reply.file(
                path.join(__dirname, 'store/sitecues-symbol.png')
            );
        }
    }
);

server.start = start;
server.stop  = stop;

server.NAME  = APP_NAME;
// Project root relative path to the binary that runs the testsite.
server.BIN_PATH = pkg.bin[APP_NAME];
// Define a signal that dependants should emit or listen for
// when determining testsite readiness.
server.READY_MSG = APP_NAME + ' is ready';

module.exports = server;
