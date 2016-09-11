'use strict';

const path = require('path');
const { Server } = require('hapi');
// Static file serving.
const inert = require('inert');
// View templating.
const vision = require('vision');
const handlebars = require('handlebars');
const pkg = require('../package.json');
const status = require('./route/status');
const home = require('./route/index');
const logo = require('./route/logo');

const appName = pkg.name + '-testsite';
const server = new Server({
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
const doStart = (resolve, reject) => {
    const onStart = (err) => {
        if (err) {
            reject(err);
            return;
        }

        console.log('Server running at:', server.info.uri);
        // Signal to the outside world that the server is ready and listening.
        resolve(server.info.uri);
    };

    // Code to run when plugins are finished being set up.
    const onPluginsReady = (err) => {
        if (err) {
            reject(err);
            return;
        }

        // Use the views plugin we registered with the server
        // to configure how it will render templates.
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

        // Add publicly available routes.
        server.route([
            status,
            home,
            logo
        ]);

        // Tell Hapi to begin listening on the configured hostname(s) and port(s).
        _start(onStart);
    };

    console.log('Testsite starting.');

    // Setup plugins to extend Hapi's functionality.
    server.register(
        [
            inert,
            vision
        ],
        // Code to run when all plugins are loaded.
        onPluginsReady
    );
};

const start = () => {
    return new Promise(doStart);
};

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
