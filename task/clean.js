var pkgDir = require('pkg-dir'),
    path   = require('path'),
    del    = require('del'),
    BUILD_DIR = 'build';

function clean() {
    return pkgDir(__dirname)
        .then(
            function (appRoot) {
                return del(path.resolve(appRoot, BUILD_DIR));
            }
        );
}

module.exports = clean;
