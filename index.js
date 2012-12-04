'use strict';

var _ = require('lodash');
var spawn = require('child_process').spawn;
var through = require('through');
var wrapColor = require('ansi-color').set;
if (process.logging) var log = process.logging('dictator');
if (process.logStream) var logStream = process.logStream;

function colorize(color) {
  return through(function(data) {
    this.emit('data', wrapColor(data, color));
  });
}

exports.runReady = runReady;
function runReady(procs) {
  _.forEach(procs, function(proc, name) {
    proc.name = name;
    if (_.isEmpty(proc.deps) && !proc.child) {
      run(proc, procs);
      runReady(procs);
    }
  });
}

function run(proc, procs) {
  var child = proc.child = spawn(proc.cmd, proc.args);
  if (log) log('%s started', proc.cmd);
  if (logStream) {
    child.stdout.pipe(colorize(proc.color)).pipe(logStream);
    child.stderr.pipe(colorize(proc.color)).pipe(logStream);
  }
  child.on('exit', function() {
    if (log) log('%s terminated', proc.name);
    delete proc.child;
    process.nextTick(terminate);
  });
  _.forEach(procs, function(proc_) {
    if (_.contains(proc_.deps, proc.name)) {
      proc_.deps = _.without(proc_.deps, proc.name);
    }
  });
}

exports.terminate = terminate;
function terminate(procs) {
  var running = _.reject(_.pluck(procs, 'child'), _.isUndefined);
  _.forEach(running, function(child) { child.kill('SIGTERM'); });
  if (_.isEmpty(running)) setTimeout(process.exit, 100);
}
