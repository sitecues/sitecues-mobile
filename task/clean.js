'use strict';

const path = require('path');
const pkgDir = require('pkg-dir');
const del = require('del');

const clean = () => {
    return pkgDir(__dirname).then((appRoot) => {
        return del(path.join(appRoot, 'build'));
    });
};

module.exports = clean;
