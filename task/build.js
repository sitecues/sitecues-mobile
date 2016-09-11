'use strict';

const fs = require('fs');
const path = require('path');
const { rollup } = require('rollup');
const delivr = require('delivr');
const json = require('rollup-plugin-json');
const babel = require('rollup-plugin-babel');
const appName = require('read-pkg-up').sync(__dirname).pkg.name;

const readDep = (depName) => {
    return new Promise((resolve, reject) => {
        const filePath = require.resolve(depName);
        fs.readFile(filePath, 'utf8', (err, content) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(content);
        });
    });
};

const build = () => {
    const bundleConf = {
        entry   : 'lib/js/run.js',
        plugins : [
            json({
                include : [
                    'package.json'
                ]
            }),
            babel({
                exclude : [
                    'node_modules/**'
                ],
                plugins : [
                    'transform-es2015-classes'
                ],
                presets : [
                    'es2015-rollup'
                ]
            })
        ]
    };

    return rollup(bundleConf).then((bundle) => {
        return Promise.all([
            readDep('babel-polyfill/dist/polyfill'),
            readDep('whatwg-fetch')
        ]).then((polyfills) => {
            return delivr.prepare({ bucket : appName }).then((dir) => {
                return bundle.write({
                    format    : 'iife',
                    banner    : polyfills.join(''),
                    dest      : path.join(dir.path, appName + '.js'),
                    sourceMap : true
                }).then(() => {
                    // Move the temp dir to its permanent home and set up
                    // latest links.
                    return dir.finalize();
                });
            });
        });
    });
};

module.exports = build;
