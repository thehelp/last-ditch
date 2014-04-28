// # LastDitch
//

// [strict mode](http://mzl.la/1fRhnam)
'use strict';

var fs = require('fs');

var _ = require('lodash');
var winston = require('winston');

var Twilio = require('thehelp-messaging').Twilio;

// `constructor` has no required parameters.
function LastDitch(options) {
  _.bindAll(this);

  options = options || {};
  this.appName = options.appName || process.env.APP_NAME || 'DefaultApp';
  this.crashLog = options.crashLog || process.env.CRASH_LOG || 'logs/crash.log';

  this.development = options.development;
  if (typeof this.development === 'undefined') {
    this.development = process.env.NODE_ENV === 'development';
  }

  this.twilio = new Twilio();
}

module.exports = LastDitch;


LastDitch.prototype.send = function(err, req, cb) {
  var stack = err ? err.stack : '';
  stack = stack.split(process.cwd()).join('');

  var entry = {
    stack: stack,
    timestamp: new Date(),
    message: 'crashed: ' + stack,
    level: 'error'
  };
  if (req && req.url) {
    entry.url = req.url;
    entry.message = 'crashed handling ' + req.url + ': ' + entry.stack;
  }

  fs.appendFileSync(this.crashLog, JSON.stringify(entry) + '\n');
  if (this.development) {
    process.nextTick(cb);
  }
  else {
    this.sendSMS(entry, cb);
  }
};

LastDitch.prototype.sendSMS = function(entry, cb) {
  var sms = {
    to: process.env.NOTIFY_SMS_TO,
    from: process.env.NOTIFY_SMS_FROM,
    body: this.appName + ' '
  };

  if (!sms.to || !sms.from) {
    if (cb) {
      process.nextTick(cb);
    }
    return;
  }

  if (entry.url) {
    sms.body += entry.url + ': ';
  }
  sms.body += entry.stack;
  sms.body = this.twilio.truncateForSMS(sms.body);

  winston.info('Sending SMS message with crash information...');
  this.twilio.send(sms, function(err) {
    winston.info('Done sending SMS');

    if (cb) {
      cb(err);
    }
  });
};
