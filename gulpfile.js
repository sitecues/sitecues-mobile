'use strict';

// Task runner and build system.
const gulp = require('gulp');
const clean = require('./task/clean');
const build = require('./task/build');
const testsite = require('./task/testsite');

// Register tasks, so that Gulp understands what to do by name.

gulp.task('clean', clean);

gulp.task('build', build);

// For lazy people.
gulp.task('serve', testsite.start);
// For people that prefer symmetry over laziness.
gulp.task('start-testsite', testsite.start);
gulp.task('browse-testsite', testsite.browse);
gulp.task('stop-testsite', testsite.stop);

const dev = gulp.series(
    testsite.start,
    testsite.browse
);

// For the lazy who still want to be explicit.
gulp.task('dev', dev);

// Our default task. Run when "gulp" is called with no task names.
gulp.task('default', dev);
