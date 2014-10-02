
'use strict';

var fs = require('fs');
var fork = require('child_process').fork;

var test = require('thehelp-test');
var expect = test.expect;

describe('basic end-to-end', function() {

  beforeEach(function(done) {
    fs.unlink('crash.log', done);
  });

  it('registers process-level handler, adds entry to crash.log', function(done) {
    var child = fork('test/start.js', {silent: true});

    child.on('exit', function(code) {
      expect(code).not.to.equal(0);

      var log = fs.readFileSync('crash.log');
      log = JSON.parse(log);

      expect(log).to.have.property('level', 'error');
      expect(log).to.have.property('timestamp');
      expect(log).to.have.property('message');

      // console.log(log.message);

      done();
    });
  });

});

