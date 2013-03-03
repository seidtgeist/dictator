'use strict';

var Bacon = require('baconjs').Bacon;
var _ = require('lodash');
var Process = require('./process');
//var EventEmitter = require('events').EventEmitter;
//var _ = require('lodash');

var Dictator = module.exports = function () {
  //this.emitter = new EventEmitter();
  this.bus = Bacon.Bus();
  this.processes = {};
};

Dictator.prototype = {
  addProcess: function (name, descriptor) {
    this.processes[name] = new Process(name, descriptor, this);
  },

  activate: function () {
    _.each(this.processes, function (process) {
      process.activate();
    });
  },

  start: function () {
    this.bus.push('dictator:start');
  },

  stop: function () {
    this.bus.push('dictator:stop');
    this.bus.end();
  }
};
