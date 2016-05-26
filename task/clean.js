'use strict';

const
    pkgDir = require('pkg-dir'),
    path   = require('path'),
    del    = require('del'),
    buildDir = 'build';

function clean() {
    return pkgDir(__dirname).then((appRoot) => {
        return del(path.resolve(appRoot, buildDir));
    });
}

module.exports = clean;
