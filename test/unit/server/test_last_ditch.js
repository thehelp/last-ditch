
'use strict';

var test = require('thehelp-test');
var LastDitch = require('../../../src/server/last_ditch');
var sinon = test.sinon;
var expect = test.core.expect;

describe('LastDitch', function() {
  var lastDitch;

  beforeEach(function() {
    lastDitch = new LastDitch();
  });

  describe('#sendSMS', function() {
    it('calls callback even if twilio send never returns', function(done) {
      this.timeout(2500);

      lastDitch.twilio.send = sinon.stub();
      lastDitch.sendSMS(new Error(), function() {
        expect(lastDitch).to.have.deep.property('twilio.send.callCount', 1);

        done();
      });
    });
  });

  describe('#send', function() {
    it('calls callback even if fs.appendFileSync throws', function(done) {
      lastDitch.fs.appendFileSync = sinon.spy(function() {
        throw new Error('couldn\'t save file');
      });
      lastDitch.send(new Error(), null, function() {
        expect(lastDitch).to.have.deep.property('fs.appendFileSync.callCount', 1);

        done();
      });
    });
  });
});

