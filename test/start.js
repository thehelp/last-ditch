
'use strict';

var path = require('path');
var core = require('thehelp-core');

core.env.merge(path.join(__dirname, '../env.json'));
core.logs.setupConsole();

var lastDitch = require('../src/server/index');

lastDitch.setupTopLevelHandler();

setTimeout(function() {
  console.log('About to crash...');

  var options;
  options.blah();
}, 100);
