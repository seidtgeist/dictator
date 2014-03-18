'use strict';

var _ = require('lodash');
var spawn = require('child_process').spawn;
var split = require('split');
var through = require('through');
var wrapColor = require('ansi-color').set;
if (process.logging) var log = process.logging('dictator');
if (process.logStream) var logStream = process.logStream;

var DEFAULT_WAIT = 1000;

function enhance(proc) {
  var color = proc.color;
  var prefix = '[' + proc.name + '] ';
  return through(function(data) {
    this.emit('data', wrapColor(prefix + data, color) + '\n');
  });
}

exports.rule = rule;
function rule(procs, options) {
  if (!_.isEmpty(options.only) && !_.isEmpty(options.exclude)) {
    throw new Error('Cannot combine only and exclude parameters');
  }

  if (!_.isEmpty(options.only)) {
    procs = _.pick(procs, options.only);
    procs = _.mapValues(procs, function(proc) {
      proc.deps = _.intersection(proc.deps, options.only);
      return proc;
    });
  }

  if (!_.isEmpty(options.exclude)) {
    procs = _.omit(procs, options.exclude);
    procs = _.mapValues(procs, function(proc) {
      proc.deps = _.without(proc.deps, options.exclude);
      return proc;
    });
  }

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
      if(!dep) {
        throw new Error('Process '+name+' is needed for '+proc.name+' but it has not been started.');
      }

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
    child.stdout.pipe(split()).pipe(enhance(proc)).pipe(logStream);
    child.stderr.pipe(split()).pipe(enhance(proc)).pipe(logStream);
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
