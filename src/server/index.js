// index
// ========
// Pulls in everything needed for use via npm.

'use strict';

var winston = require('winston');
var LastDitch = require('./last_ditch.js');

var singleton = new LastDitch();

// The result of requiring this modules is a method that can be called directly with an
// Error object.
module.exports = singleton.go;

// Make the full class available as well as the singleton's `send` method
module.exports.LastDitch = LastDitch;

// `setupTopLevelHandler` makes it very easy to set up a top-level exception handler.
// Set `options.go` to provide your own `LastDitch` instance's `go()` method, or really
// any other method you'd like called (of the signature `function(err, cb)`)
module.exports.setupTopLevelHandler = function setupTopLevelHandler(options) {
  options = options || {};
  options.go = options.go || singleton.go;

  process.on('uncaughtException', function(err) {
    options.go(err, function() {
      winston.info('Error saved! Exiting...');
      process.exit(1);
    });
  });
};


