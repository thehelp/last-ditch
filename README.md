# thehelp-last-ditch

This project helps your processes communicate that they are about to die by writing to
a less-fallible log than winston's file transport and sending an SMS message.

## Setup

These environment variables are required

```
"NOTIFY_SMS_TO": "a normalized phone number (like +18005551212) to receive SMS reports",
"NOTIFY_SMS_FROM": "a normalized, valid Twilio from number (part of your Twilio account)"

"TWILIO_KEY": "'Account SID' on your account detail page",
"TWILIO_TOKEN": "your 'Auth Token' on that same page",
```

These are optional:

```
"APP_NAME": "TestApp", // the name of your app for text messages
"CRASH_LOG": "logs/crash.og", // Where last ditch logs will be appended
"NODE_ENV": "development", // SMS messages will be sent if anything other than 'development'
```

## Usage

You can very quickly set up a handler for uncaught exceptions at the process level:

```
var lastDitch = require('thehelp-last-ditch');
lastDitch.setupTopLevelHandler();
```

However, if you're using domains or some other error-handling system, you'll want to call lastDitch directly:

```
var info = {
  url: '/account'
};

domain.on('error', function(err) {
  lastDitch(err, info, function() {
    // message sent; shut down process
  })
})
```

Lastly, you can create an instance of LastDitch yourself, supplying configuration parameters programmatically:

```
var instance = new lastDitch.LastDitch({
  appName: 'MyApp',
  crashLog: 'logs/worker1.log',
  development: true
});

instance.send(err, null, function() {
  process.exit();
});
```

## Development

Run unit and integration tests like this:

    grunt test

Tests, static analysis, documentation generation and more are all run by default:

    grunt

## History

### 0.2.0 (2014-04-28)

* Removing direct support for `GracefulWorker` and keeping track of whether we're actively sending to Twilio; now expect users to rely on the callback.
* Additional documentation

### 0.1.0 (2014-04-25)

* Default send function returned on `require()` of this module
* `LastDitch` class available for direct use
* `setupTopLevelHandler()` to make it easy to set up an 'uncaughtException' handler

## License

(The MIT License)

Copyright (c) 2013 Scott Nonnenberg &lt;scott@nonnenberg.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
