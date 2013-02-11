#!/usr/bin/env node

'use strict';

process.logging = function() {
  return console.log;
};

process.logStream = process.stdout;
process.logStream.setMaxListeners(0);

var dictator = require('..');
var fs = require('fs');

var filename = process.argv[2] || 'dictator.json';
var procs = JSON.parse(fs.readFileSync(filename));

dictator.rule(procs);
process.on('SIGINT', function() { dictator.terminate(procs); });
process.on('exit', function() { dictator.terminate(procs); });
