
'use strict';

var fs = require('fs');
var fork = require('child_process').fork;
var path = require('path');

var test = require('thehelp-test');
var expect = test.core.expect;

var index = require('../../../src/server/index');
var LastDitch = index.LastDitch;

describe('thehelp-last-ditch', function() {

  it('adds entry to logs/crash.logs', function(done) {
    fs.unlink('logs/crash.log', function() {
      var child = fork('test/start.js', {silent: true});

      child.on('exit', function(code) {
        expect(code).not.to.equal(0);

        var log = fs.readFileSync(path.join(__dirname, '../../../logs/crash.log'));
        log = JSON.parse(log);

        expect(log).to.have.property('level', 'error');
        expect(log).to.have.property('timestamp');
        expect(log).to.have.property('message');
        expect(log).to.have.property('stack');

        // console.log(log.message);

        done();
      });
    });
  });

  it('sends SMS message with error text (manually check for SMS)', function(done) {
    this.timeout(10000);

    process.env = require('../../../env.json');

    var instance = new LastDitch({
      development: false
    });
    var info = {
      url: '/login'
    };

    var err = new Error('SMS test error');
    instance.send(err, info, function() {

      // in the future, set up server to receive SMS messages, and then query on that)

      done();
    });
  });

});

