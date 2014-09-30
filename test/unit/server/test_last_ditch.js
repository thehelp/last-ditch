
'use strict';

var test = require('thehelp-test');
var LastDitch = require('../../../src/server/last_ditch');
var sinon = test.sinon;
var expect = test.expect;

describe('LastDitch', function() {
  var lastDitch;

  beforeEach(function() {
    lastDitch = new LastDitch();
  });

  describe('#sendSMS', function() {
    it('calls callback even if twilio send never returns', function(done) {
      this.timeout(2500);

      lastDitch.twilio.send = sinon.stub();
      lastDitch.sendSMS({}, function() {
        expect(lastDitch).to.have.deep.property('twilio.send.callCount', 1);

        done();
      });
    });

    it('calls callback with err if twilio returns an error', function(done) {
      lastDitch.twilio.send = sinon.stub().yields(new Error('message'));

      lastDitch.sendSMS({}, function(err) {
        expect(err).to.have.property('message', 'message');

        done();
      });
    });

    it('immediately calls callback if To is not defined', function(done) {
      var old = process.env.NOTIFY_SMS_TO;
      delete process.env.NOTIFY_SMS_TO;

      lastDitch.sendSMS({}, function() {
        expect(arguments).to.have.length(0);
        process.env.NOTIFY_SMS_TO = old;

        done();
      });
    });

    it('immediately calls callback if From is not defined', function(done) {
      var old = process.env.NOTIFY_SMS_FROM;
      delete process.env.NOTIFY_SMS_FROM;

      lastDitch.sendSMS({}, function() {
        expect(arguments).to.have.length(0);
        process.env.NOTIFY_SMS_FROM = old;

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
