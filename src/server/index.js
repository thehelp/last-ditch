// index
// ========
// Pulls in everything needed for use via npm.

'use strict';

var winston = require('winston');
var LastDitch = require('./last_ditch.js');

var singleton = new LastDitch();

// The result of requiring this modules is a method that can be called directly with an
// Error object.
module.exports = singleton.send;

// Make the full class available as well as the singleton's `send` method
module.exports.LastDitch = LastDitch;

// `setupTopLevelHandler` makes it very easy to set up a top-level exception handler.
// Set `options.lastDitch` to provide your own `LastDitch` instance, or really any other
// method you'd like called.
module.exports.setupTopLevelHandler = function(options) {
  options = options || {};
  options.lastDitch = options.lastDitch || singleton.send;

  process.on('uncaughtException', function(err) {
    winston.info('Uncaught exception! ' + err.stack);
    options.lastDitch(err, null, function() {
      winston.info('Error saved! Exiting...');
      process.exit(1);
    });
  });
};


