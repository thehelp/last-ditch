// # LastDitch
// The class that makes it all happen.

'use strict';

var fs = require('fs');
var os = require('os');

var async = require('async');

var core = require('thehelp-core');
var logShim = require('thehelp-log-shim');

var messaging = require('thehelp-messaging');
var Twilio = messaging.Twilio;
var Sendgrid = messaging.Sendgrid;

/*
`constructor` has no required parameters, but quite a few optional parameters:

+ `appName` - the name of the app, used when sending text messages
(can set this with THEHELP_APP_NAME environment variable)
+ `development` - if set to true, neither email nor SMS messages be sent. If not set
 manally, is set to true if `process.env.NODE_ENV === 'development'`
+ `log` - if you'd like to use something other than what `thehelp-log-shim` provdes for
logging, supply an object with `error`, `info` and `warn` keys (signature:
`function(string)`)
+ `targets` - an array of the targets where you'd like error information to go. See
`LastDitch.DEFAULT_TARGETS` and `LastDitch.ALL_TARGETS` below.
+ `timeout` - how long to wait for targets to return before calling `go()`'s provided
callback

These are specific to various targets:

+ `crashLog` - the file path of the crash log file (can use THEHELP_CRASH_LOG environment
variable)
+ `sms` - object with `send()` and `truncate()` methods. See `sendSMS()` below.
+ `email` - object with `send()` method. See `sendEmail()` below.

*/
function LastDitch(options) {
  /*jshint maxcomplexity: 10 */

  options = options || {};
  this.appName = options.appName || process.env.THEHELP_APP_NAME || 'DefaultApp';
  this.crashLogFile =
    options.crashLog || process.env.THEHELP_CRASH_LOG || 'crash.log';

  this.development = options.development;
  if (typeof this.development === 'undefined') {
    this.development = process.env.NODE_ENV === 'development';
  }

  this.timeout = options.timeout || 2000;
  this.log = options.log || logShim('thehelp-last-ditch');
  this.targets = options.targets || LastDitch.DEFAULT_TARGETS;

  this.fs = fs;

  this._setupMessaging(options);
  this._bindAll();
}

module.exports = LastDitch;

LastDitch.DEFAULT_TARGETS = ['stderr', 'crashLog'];
LastDitch.ALL_TARGETS = ['stderr', 'crashLog', 'sendSMS', 'sendEmail'];


// Commonly-used Methods
// ========

// `go` processes the provided `err`, then farms it out to every method listed in
// `this.targets`.
LastDitch.prototype.go = function go(err, options, cb) {
  var _this = this;

  if (!cb) {
    cb = options;
    options = {};
  }

  if (!err) {
    return process.nextTick(cb);
  }

  options = options || {};

  var useTarget = function useTarget(target, next) {
    var fn = _this[target];
    if (fn) {
      return fn(err, options, next);
    }
    _this.log.error('Could not find \'' + target + '\' target');
    return next();
  };

  var called = false;
  var callCbOnce = function callCbOnce(err) {
    if (called) {
      return;
    }
    called = true;
    if (cb) {
      cb(err);
    }
  };

  async.map(this.targets, useTarget, callCbOnce);

  // guarantee callback in 2 seconds, even if targets never return
  var timeout = setTimeout(function() {
    if (!called) {
      _this.log.warn('all targets didn\'t return fast enough; forcing return');
      callCbOnce();
    }
  }, this.timeout);

  // this ensures that this timeout doesn't prevent the process from going down
  timeout.unref();
};


// Targets
// =======

// `stderr` simply logs the error message out to stderr. The most reliable target.
LastDitch.prototype.stderr = function stderr(err, options, cb) {
  var urlSummary = 'crash';
  if (options.url) {
    urlSummary += ' handling ' + options.url;
  }
  console.error('LastDitch:', urlSummary + ':', core.breadcrumbs.toString(err));
  return process.nextTick(cb);
};

/*
`crashLog` appends a JSON-formatted log entry to a file you specify
(crash.log in process current working directory by default).

_Note: Not fully reliable; if the machine is crashing because the machine is going
down unexpectedly, the filesystem may no longer be available. Yes, I've run into this._
*/
LastDitch.prototype.crashLog = function crashLog(err, options, cb) {
  try {
    var entry = this._buildEntry(err, options);
    this.fs.appendFileSync(this.crashLogFile, JSON.stringify(entry) + '\n');
  }
  catch (err) {
    this.log.error('Error saving crash data into crash log! ' +
      core.breadcrumbs.toString(err));
  }
  return process.nextTick(cb);
};

/*
`sendSMS` sends an SMS built from the provided error (message first, then contents,
then callstack). It's truncated first if your SMS provider has a `trunctate()` method.
This is actually a very reliable method if your machine still has internet connectivity
as your app goes down.

_Note: the `sms` object, defaulted to the `Twilio` class from `thehelp-messaging` must
have a `send()` method which takes an object with capitalized keys. Blame Twilio, not
me!_
*/
LastDitch.prototype.sendSMS = function sendSMS(err, options, cb) {
  var _this = this;

  if (this.development) {
    return cb();
  }

  var sms = {
    To: process.env.THEHELP_LD_SMS_TO,
    From: process.env.THEHELP_LD_SMS_FROM,
    Body: this.appName + ' on ' + os.hostname() + ': ' + err.message + '\n' +
      core.breadcrumbs._prepareStack(err)
  };

  if (!sms.To || !sms.From) {
    return process.nextTick(cb);
  }

  if (this.sms.truncate) {
    sms.Body = this.sms.truncate(sms.Body);
  }

  this.log.info('Sending SMS message with crash information...');
  this.sms.send(sms, function(err) {
    if (err) {
      _this.log.error('SMS not successfully sent: ' + core.breadcrumbs.toString(err));
      return cb(err);
    }

    _this.log.info('Done sending SMS');
    return cb();
  });
};

/*
`sendEmail` sends an email built from the provided error (message first, then contents,
then callstack).

_Note: the `sms` object, defaulted to the `Twilio` class from `thehelp-messaging` must
have a `send()` method which takes an object with capitalized keys. Blame Twilio, not
me!_
*/
LastDitch.prototype.sendEmail = function sendEmail(err, options, cb) {
  var _this = this;

  if (this.development) {
    return cb();
  }

  var email = {
    to: process.env.THEHELP_LD_EMAIL_TO,
    from: process.env.THEHELP_LD_EMAIL_FROM,
    subject: this.appName + ' crashed on ' + os.hostname(),
    text: 'app: ' + this.appName + '\n' +
      'host: ' + os.hostname()
  };

  if (!email.to || !email.from) {
    return process.nextTick(cb);
  }

  if (options.url) {
    email.text += '\n' + 'url: ' + options.url;
  }

  email.text += '\n\n' + core.breadcrumbs.toString(err);

  this.log.info('Sending email message with crash information...');
  this.email.send(email, function(err) {
    if (err) {
      _this.log.error('email not successfully sent: ' + core.breadcrumbs.toString(err));
      return cb(err);
    }

    _this.log.info('Done sending email');
    return cb();
  });
};


// Utility functions
// ========

// If the 'sendSMS' or 'sendEmail' targets were selected, initialize `this.email` and
// `this.sms`
LastDitch.prototype._setupMessaging = function _setupMessaging(options) {
  if (this._containsTarget('sendSMS')) {
    this.sms = options.sms || new Twilio();
    if (!this.sms.send) {
      throw new Error('sms object needs to have a send function!');
    }
  }
  if (this._containsTarget('sendEmail')) {
    this.email = options.email || new Sendgrid();
    if (!this.email.send) {
      throw new Error('email object needs to have a send function!');
    }
  }
};

// Because we don't have `lodash` as a dependency, we bind public methods to `this`
// manually.
LastDitch.prototype._bindAll = function _bindAll() {
  this.go = this.go.bind(this);
  this.stderr = this.stderr.bind(this);
  this.crashLog = this.crashLog.bind(this);
  this.sendSMS = this.sendSMS.bind(this);
  this.sendEmail = this.sendEmail.bind(this);
};

// Searches `this.targets` for the provided `query` value
LastDitch.prototype._containsTarget = function _containsTarget(query) {
  var targets = this.targets || [];
  for (var i = 0, max = targets.length; i < max; i += 1) {
    var target = targets[i];

    if (target === query) {
      return true;
    }
  }

  return false;
};

// Uses `thehelp-core` to build a good textual summary of a supplied error. Also
// includes `options.url` if provided.
LastDitch.prototype._buildEntry = function _buildEntry(err, options) {
  var errString = core.breadcrumbs.toString(err);

  var entry = {
    message: 'crashed: ' + errString,
    timestamp: new Date(),
    level: 'error'
  };
  if (options && options.url) {
    entry.url = options.url;
    entry.message = 'crashed handling ' + options.url + ': ' + errString;
  }

  return entry;
};

