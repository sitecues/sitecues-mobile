'use strict';

const fs = require('fs');
const path = require('path');
const cpy = require('cpy');
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

    let finalize;
    return rollup(bundleConf).then((bundle) => {
        return Promise.all([
            readDep('babel-polyfill/dist/polyfill'),
            readDep('whatwg-fetch')
        ]).then((polyfills) => {
            return delivr.prepare({ bucket : appName }).then((dir) => {
                finalize = dir.finalize;
                return Promise.all([
                    cpy(['{css,img}/**'], dir.path, {
                        cwd     : 'lib',
                        parents : true,
                        nodir   : true
                    }),
                    bundle.write({
                        format    : 'iife',
                        banner    : polyfills.join(''),
                        dest      : path.join(dir.path, 'js', appName + '.js'),
                        sourceMap : true
                    })
                ]);
            });
        }).then(() => {
            // Move the temp dir to its permanent home and set up
            // latest links.
            return finalize();
        });
    });
};

module.exports = build;
