// # LastDitch
// The class that makes it all happen.

// [strict mode](http://mzl.la/1fRhnam)
'use strict';

var fs = require('fs');
var os = require('os');

var _ = require('lodash');
var winston = require('winston');

var Twilio = require('thehelp-messaging').Twilio;

/*
`constructor` has no required parameters. Optional parameters:

+ `appName` - the name of the app, used when sending text messages
(can set this with APP_NAME environment variable)
+ `crashLog` - the file path of the crash log file (can use CRASH_LOG environment
variable)
+ `development` - if set to true, SMS messages will not be sent. If not set manally, is
to true if 'NODE_ENV' is 'development'

*/
function LastDitch(options) {
  _.bindAll(this);

  options = options || {};
  this.appName = options.appName || process.env.APP_NAME || 'DefaultApp';
  this.crashLog = options.crashLog || process.env.CRASH_LOG || 'logs/crash.log';

  this.development = options.development;
  if (typeof this.development === 'undefined') {
    this.development = process.env.NODE_ENV === 'development';
  }

  this.fs = fs;
  this.twilio = new Twilio();
}

module.exports = LastDitch;

// `send` saves to disk and sends an SMS if not in development mode. Special support for
// `options.url` as the URL we were attempting to return when the crash happened.
LastDitch.prototype.send = function send(err, options, cb) {
  var stack = err ? err.stack : '';
  stack = stack.split(process.cwd()).join('');

  var entry = {
    stack: stack,
    timestamp: new Date(),
    message: 'crashed: ' + stack,
    level: 'error'
  };
  if (options && options.url) {
    entry.url = options.url;
    entry.message = 'crashed handling ' + options.url + ': ' + entry.stack;
  }

  try {
    this.fs.appendFileSync(this.crashLog, JSON.stringify(entry) + '\n');
  }
  catch (err) {
    winston.error('Error saving crash data into last-ditch log! ' + err.stack);
  }

  if (this.development) {
    process.nextTick(cb);
  }
  else {
    this.sendSMS(entry, cb);
  }
};

// `sendSMS` takes a log entry object and constructs an SMS from it, then sends that
// via Twilio.
LastDitch.prototype.sendSMS = function sendSMS(entry, cb) {
  var sms = {
    to: process.env.NOTIFY_SMS_TO,
    from: process.env.NOTIFY_SMS_FROM,
    body: this.appName + ' on ' + os.hostname() + ' '
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

  var finish = _.once(function(err) {
    if (cb) {
      cb(err);
    }
  });

  this.twilio.send(sms, function(err) {
    if (err) {
      winston.error('SMS was not successfully sent: ' + err.stack);
    }
    else {
      winston.info('Done sending SMS');
    }

    finish(err);
  });

  // guarantee callback in 2 seconds, even if twilio never returns
  setTimeout(function() {
    winston.warn('Twilio didn\'t return fast enough; forcing return');
    finish();
  }, 2000);
};
