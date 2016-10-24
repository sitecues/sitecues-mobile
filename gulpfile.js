'use strict';

// Task runner and build system.
const gulp = require('gulp');
const clean = require('./task/clean');
const build = require('./task/build');

// Register tasks, so that Gulp understands what to do by name.

gulp.task('clean', clean);

gulp.task('build', build);

// Our default task. Run when "gulp" is called with no task names.
gulp.task('default', build);
