
'use strict';

var path = require('path');
var core = require('thehelp-core');
core.env.merge(path.join(__dirname, '../env.json'));

var winston = require('winston');
var lastDitch = require('../src/server/index');
lastDitch.setupTopLevelHandler();

setTimeout(function() {
  winston.info('About to crash...');
  throw new Error('this is a test error!');
}, 1000);
