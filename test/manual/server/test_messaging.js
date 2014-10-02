
'use strict';

var fs = require('fs');
var path = require('path');

var test = require('thehelp-test');
var expect = test.expect;

var LastDitch = require('../../../src/server/last_ditch');

describe('complext end-to-end', function() {

  beforeEach(function(done) {
    fs.unlink('logs/crash.log', done);
  });

  it('adds to crash log, sends SMS, sends email and logs to stderr', function(done) {
    this.timeout(5000);

    var lastDitch = new LastDitch({
      targets: LastDitch.ALL_TARGETS
    });
    var go = lastDitch.go;

    var err = new Error('this is a test error!');
    err.data = {
      left: 'yes',
      right: 'no'
    };
    var options = {
      url: '/home/settings'
    };

    go(err, options, function(err) {
      expect(err).not.to.exist;

      var log = fs.readFileSync(path.join(__dirname, '../../../logs/crash.log'));
      log = JSON.parse(log);

      expect(log).to.have.property('level', 'error');
      expect(log).to.have.property('timestamp');
      expect(log).to.have.property('message');

      // console.log(log.message);

      // maybe in the future receive messages and check them manually?

      done();
    });
  });

});

