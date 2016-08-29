'use strict';

const fs = require('fs');
const path = require('path');
const { rollup } = require('rollup');
const buildDir = require('build-dir');
const json = require('rollup-plugin-json');
const babel = require('rollup-plugin-babel');
const appName = require('read-pkg-up').sync(__dirname).pkg.name;

let banner;
let bundle;
let dir;

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
    return rollup({
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
                    ['transform-es2015-classes']
                ],
                presets : [
                    'es2015-rollup'
                ]
            })
        ]
    })
        .then((bundleData) => {
            bundle = bundleData;

            return Promise.all([
                readDep('babel-polyfill/dist/polyfill'),
                readDep('whatwg-fetch')
            ]);
        })
        .then((polyfills) => {
            banner = polyfills.join('');
            return buildDir.prepare();
        })
        .then((dirData) => {
            dir = dirData;
            return bundle.write({
                format    : 'iife',
                banner,
                dest      : path.join(dir.path, appName + '.js'),
                sourceMap : true
            });
        })
        .then(() => {
            // Move the temp dir to its permanent home and set up
            // latest links.
            return dir.finalize();
        });
};

module.exports = build;
