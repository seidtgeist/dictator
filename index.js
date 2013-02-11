'use strict';

var _ = require('lodash');
var spawn = require('child_process').spawn;
var through = require('through');
var wrapColor = require('ansi-color').set;
if (process.logging) var log = process.logging('dictator');
if (process.logStream) var logStream = process.logStream;

var DEFAULT_WAIT = 1000;

function colorize(color) {
  return through(function(data) {
    this.emit('data', wrapColor(data, color));
  });
}

exports.rule = rule;
function rule(procs) {
  setInterval(function() {
    runReady(procs);
  }, 100);
}

exports.runReady = runReady;
function runReady(procs) {
  _.forEach(procs, function(proc, name) {
    if (proc.child || proc.exitedAt) return;

    proc.name = name;

    var dependencies = proc.deps || [];
    var readyDependencies = _.filter(dependencies, function(name) {
      var dep = procs[name];
      var wait = dep.wait || DEFAULT_WAIT;
      var runningInterval = new Date() - dep.startedAt;
      return runningInterval > wait;
    });
    var dependenciesSatisfied = dependencies.length === readyDependencies.length;

    if (dependenciesSatisfied) run(proc);
  });
}

function run(proc) {
  var child = proc.child = spawn(proc.cmd, proc.args, {cwd: proc.cwd});
  proc.startedAt = new Date();
  if (log) log('%s started', proc.name);
  if (logStream) {
    child.stdout.pipe(colorize(proc.color)).pipe(logStream);
    child.stderr.pipe(colorize(proc.color)).pipe(logStream);
  }
  child.on('exit', function() {
    if (log) log('%s terminated', proc.name);
    proc.exitedAt = new Date();
    delete proc.child;
    process.nextTick(terminate);
  });
}

function runningProcs(procs) {
  return _.filter(procs, function(proc) {
    return 'child' in proc;
  });
}

exports.terminate = terminate;
function terminate(procs) {
  var running = runningProcs(procs);
  _.forEach(running, function(proc) { proc.child.kill('SIGKILL'); });
  if (_.isEmpty(running)) setTimeout(process.exit, 100);
}
