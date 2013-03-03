'use strict';

var spawn = require('child_process').spawn;
var _ = require('lodash');
var Bacon = require('baconjs').Bacon;
if (process.logging) var log = process.logging('dictator');
if (process.logStream) var logStream = process.logStream;
//var EventEmitter = require('events').EventEmitter;
//var _ = require('lodash');
var through = require('through');
var wrapColor = require('ansi-color').set;

function colorize(color) {
  return through(function(data) {
    this.emit('data', wrapColor(data, color));
  });
}

var Process = module.exports = function (name, descriptor, dictator) {
  this.name = name;
  this.dictator = dictator;
  this.descriptor = descriptor;

  this._stateBus = new Bacon.Bus();
  this.state = this._stateBus.toProperty();
};

Process.prototype = {
  activate: function () {
    var self = this;
    var processesStates = _(this.dictator.processes).at(this.descriptor.deps || []).map('state').value();
    Bacon.combineAsArray(processesStates).filter(_.all).take(1).onEnd(function () {
      self.run();
      return Bacon.noMore;
    });

    this._stateBus.push('active');
  },

  run: function() {
    this.childProcess = spawn(this.descriptor.cmd, this.descriptor.args, {cwd: this.descriptor.cwd});
    this.startedAt = new Date();
    if (log) log('%s started', this.name);
    if (logStream) {
      this.childProcess.stdout.pipe(colorize(this.descriptor.color)).pipe(logStream);
      this.childProcess.stderr.pipe(colorize(this.descriptor.color)).pipe(logStream);
    }
    this.attachChildWatcher();
    this.childProcess.on('exit', function(exitStatus) {
      if (log) log('%s terminated', this.childProcess.name);
      this.childProcess.exitedAt = new Date();
      delete this.childProcess;
      //process.nextTick(terminate);
      if (exitStatus !== 0) {
        this._stateBus.push('crashed');
      }
      this._stateBus.push('terminated');
    });
  },

  attachChildWatcher: function () {
    var self = this;
    if (typeof this.descriptor.ready === 'String') {
      var filter = this.descriptor.ready;
      var outStream = this.childProcess.stdout;
      Bacon.fromEventTarget(outStream, 'data', function (buffer) {
        return buffer.toString();
      }).filter(function (s) {
        return s.substr(filter) > -1;
      }).take(1).onEnd(function () {
        self._stateBus.push('ready');
        return Bacon.noMore;
      });
    } else if (typeof this.descriptor.ready === 'Number') {
      setTimeout(function () {
        self._stateBus.push('ready');
      }, this.descriptor.number * 1000);
    } else {
      self._stateBus.push('ready');
    }
  }
};
