'use strict';

// Server framework.
const hapi = require('hapi');
// Application metadata.
const pkg = require('../package.json');
// Cross-platform utilities for resolving and normalizing file paths.
const path = require('path');
const appName = pkg.name + '-testsite';
const server = new hapi.Server({
    connections : {
        routes : {
            files : {
                relativeTo : path.join(__dirname, 'store')
            }
        }
    }
});
const _start = server.start.bind(server);

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

        console.log('Server running at:', server.info.uri);
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
        // to configure how it will render templates.
        server.views({
            engines : {
                html : require('handlebars')
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

        // Add publicly available routes.
        server.route([
            require('./route/status'),
            require('./route/index'),
            require('./route/logo')
        ]);

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

const start = () => {
    return new Promise(doStart);
}

// Setup a virtual server instance.
server.connection({ port : 3000 });

server.start = start;

server.NAME = appName;
// Project root relative path to the binary that runs the testsite.
server.BIN_PATH = pkg.bin[appName];
// Define a signal that dependants should emit or listen for
// when determining testsite readiness.
server.READY_MSG = appName + ' is ready';

module.exports = server;
