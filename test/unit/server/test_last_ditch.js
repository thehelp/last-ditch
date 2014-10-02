
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

  describe('#constructor', function() {
    /*jshint nonew: false */

    it('throws when email object doesn\'t have send key', function() {
      expect(function() {
        new LastDitch({
          targets: ['sendEmail'],
          email: {}
        });
      }).to['throw']().that.match(/email object needs to have a send/);
    });

    it('throws when sms object doesn\'t have send key', function() {
      expect(function() {
        new LastDitch({
          targets: ['sendSMS'],
          sms: {}
        });
      }).to['throw']().that.match(/sms object needs to have a send/);
    });
  });

  describe('#go', function() {
    it('calls callback even if a transport never returns', function(done) {
      lastDitch.timeout = 100;
      lastDitch.stderr = sinon.stub();

      lastDitch.go(new Error(), done);
    });

    it('calls callback once - all targets return first', function(done) {
      lastDitch.timeout = 100;

      var cb = sinon.stub();
      lastDitch.go(new Error(), cb);

      setTimeout(function() {
        expect(cb).to.have.property('callCount', 1);

        done();
      }, 200);
    });

    it('calls callback once - timeout hits first', function(done) {
      lastDitch.timeout = 100;
      lastDitch.stderr = sinon.spy(function(err, options, cb) {
        setTimeout(cb, 200);
      });

      var cb = sinon.stub();
      lastDitch.go(new Error(), cb);

      setTimeout(function() {
        expect(cb).to.have.property('callCount', 1);

        done();
      }, 300);
    });

    it('handles a nonexistent target', function(done) {
      lastDitch.targets = ['random'];
      lastDitch.go(new Error(), done);
    });

    it('handles null err', function(done) {
      lastDitch.go(null, done);
    });

    it('doesn\'t throw if no callback provided', function(done) {
      lastDitch.timeout = 100;
      lastDitch.go(new Error());
      setTimeout(done, 200);
    });
  });

  describe('#sendSMS', function() {
    beforeEach(function() {
      lastDitch.sms = {
        send: sinon.stub().yields(new Error('message'))
      };
    });

    it('calls callback immediately if development set to true', function(done) {
      lastDitch.development = true;
      lastDitch.sendSMS({}, {}, function() {
        expect(lastDitch).to.have.deep.property('sms.send.callCount', 0);

        done();
      });
    });

    it('calls callback with err if sms.send returns an error', function(done) {
      lastDitch.sendSMS({}, {}, function(err) {
        expect(lastDitch).to.have.deep.property('sms.send.callCount', 1);

        expect(err).to.have.property('message', 'message');

        done();
      });
    });

    it('immediately calls callback if To is not defined', function(done) {
      var old = process.env.THEHELP_LD_SMS_TO;
      delete process.env.THEHELP_LD_SMS_TO;

      lastDitch.sendSMS({}, {}, function() {
        expect(arguments).to.have.length(0);
        process.env.THEHELP_LD_SMS_TO = old;

        expect(lastDitch).to.have.deep.property('sms.send.callCount', 0);

        done();
      });
    });

    it('immediately calls callback if From is not defined', function(done) {
      var old = process.env.THEHELP_LD_SMS_FROM;
      delete process.env.THEHELP_LD_SMS_FROM;

      lastDitch.sendSMS({}, {}, function() {
        expect(arguments).to.have.length(0);
        process.env.THEHELP_LD_SMS_FROM = old;

        expect(lastDitch).to.have.deep.property('sms.send.callCount', 0);

        done();
      });
    });
  });

  describe('#sendEmail', function() {
    beforeEach(function() {
      lastDitch.email = {
        send: sinon.stub().yields(new Error('message'))
      };
    });

    it('calls callback immediately if development set to true', function(done) {
      lastDitch.development = true;
      lastDitch.sendEmail({}, {}, function() {
        expect(lastDitch).to.have.deep.property('email.send.callCount', 0);

        done();
      });
    });

    it('calls callback with err if email.send returns an error', function(done) {
      lastDitch.sendEmail({}, {}, function(err) {
        expect(lastDitch).to.have.deep.property('email.send.callCount', 1);

        expect(err).to.have.property('message', 'message');

        done();
      });
    });

    it('immediately calls callback if To is not defined', function(done) {
      var old = process.env.THEHELP_LD_EMAIL_TO;
      delete process.env.THEHELP_LD_EMAIL_TO;

      lastDitch.sendEmail({}, {}, function() {
        expect(arguments).to.have.length(0);
        process.env.THEHELP_LD_EMAIL_TO = old;

        expect(lastDitch).to.have.deep.property('email.send.callCount', 0);

        done();
      });
    });

    it('immediately calls callback if From is not defined', function(done) {
      var old = process.env.THEHELP_LD_EMAIL_FROM;
      delete process.env.THEHELP_LD_EMAIL_FROM;

      lastDitch.sendEmail({}, {}, function() {
        expect(arguments).to.have.length(0);
        process.env.THEHELP_LD_EMAIL_FROM = old;

        expect(lastDitch).to.have.deep.property('email.send.callCount', 0);

        done();
      });
    });
  });

  describe('#crashLog', function() {
    it('calls callback even if fs.appendFileSync throws', function(done) {
      lastDitch.fs.appendFileSync = sinon.spy(function() {
        throw new Error('couldn\'t save file');
      });
      lastDitch.crashLog({}, {}, function() {
        expect(lastDitch).to.have.deep.property('fs.appendFileSync.callCount', 1);

        done();
      });
    });
  });

  describe('#stderr', function() {
    it('calls callback', function(done) {
      lastDitch.stderr({}, {}, function() {
        expect(arguments).to.have.length(0);

        done();
      });
    });
  });

});
