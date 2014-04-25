
'use strict';

process.env = require('../env');

var winston = require('winston');
var lastDitch = require('../src/server/index');
lastDitch.setupTopLevelHandler();

setTimeout(function() {
  winston.info('About to crash...');
  throw new Error('this is a test error!');
}, 1000);
