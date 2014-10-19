## 1.1.0 (2014-10-17)

* `winston` no longer a dependency. If you want logging, you'll need to install a logging package yourself. More info: [`thehelp-log-shim`](https://github.com/thehelp/log-shim)

## 1.0.0 (2014-10-02)

Breaking:

* Key method on `LastDitch` object is now `go()` instead of `send()`
* Default location for crash.log is the current working directory (instead of inside ./logs/)
* Environment variables changed; now all prefixed with 'THEHELP_'

Other:

* Now use `thehelp-messaging` 1.0.0
* Instead of always appending to log file and sending SMS, move to configurable targets: `stderr`, `crashLog`, `sendSMS`, `sendEmail`. `stderr` and `crashLog` are on by default.
* Now support calling root method (`LastDitch.go`) with two arguments or just one argument and no callback.
* Further bullet-proofing: handle null `err`, missing targets, etc.
* Comprehensive test coverage

## 0.3.1 (2014-07-31)

* Include machine hostname in text message

## 0.3.0 (2014-07-31)

* Guaranteed callback if we can't append to the crash log
* Guaranteed callback if the `twilio.send` call never returns, or takes longer than 2 seconds
* Update dev dependencies

## 0.2.2 (2014-05-27)

* Pare down what's in the npm package

## 0.2.1 (2014-05-25)

* Update minor version: `async`
* Update dev dependencies

## 0.2.0 (2014-04-28)

* Removing direct support for `GracefulWorker` and keeping track of whether we're actively sending to Twilio; now expect users to rely on the callback.
* Additional documentation

## 0.1.0 (2014-04-25)

* Default send function returned on `require()` of this module
* `LastDitch` class available for direct use
* `setupTopLevelHandler()` to make it easy to set up an 'uncaughtException' handler
