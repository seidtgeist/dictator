#!/usr/bin/env node

'use strict';

var optimist = require('optimist')
  .usage('Usage: $0 [dictator.json]')
  .option('help',    {alias: 'h', describe: 'Show help'})
  .option('only',    {alias: 'o', describe: 'Run only some services'})
  .option('exclude', {alias: 'e', describe: 'Don\'t run some services'});
var argv = optimist.argv;

if (argv.help) {
  optimist.showHelp();
  process.exit(0);
}

process.logging = function() {
  return console.log;
};

process.logStream = process.stdout;
process.logStream.setMaxListeners(0);

var dictator = require('..');
var fs = require('fs');

var filename = argv._[1] || 'dictator.json';
var procs = JSON.parse(fs.readFileSync(filename));

dictator.rule(procs, {
  only: [].concat(argv.only || []),
  exclude: [].concat(argv.exclude || [])
});
process.on('SIGINT', function() { dictator.terminate(procs); });
process.on('exit', function() { dictator.terminate(procs); });
