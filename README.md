[![Build Status](https://travis-ci.org/thehelp/last-ditch.svg?branch=master)](https://travis-ci.org/thehelp/last-ditch)

# thehelp-last-ditch

Make sure you know when your Node.js process crashes: output the error to stderr, append it to a file, send it via email, and send it via SMS. Cover all your bases in case of loss of filesystem access or internet connectivity.  [More information about `thehelp`.](https://blog.scottnonnenberg.com/the-state-of-thehelp/)

## Features

* Super-easy default setup: logging of error info to stderr, synchronous append to a log file, and incrementing a [`statsd`](https://github.com/etsy/statsd) counter (`process.env.THEHELP_APP_NAME + '.crashes'`)
* Just a few more steps to sending SMS and Email via [`thehelp-messaging`](https://github.com/thehelp/messaging)
* Can participate in your program's logging mechanism via [`thehelp-log-shim`](https://github.com/thehelp/log-shim) (logging is primarily around SMS/email send status, file access failures, etc.)

## Setup

First install the project as a dependency:

```bash
npm install thehelp-last-ditch --save
```

### Usage

Get going quick:

```javascript
var lastDitch = require('thehelp-last-ditch');
lastDitch.setupTopLevelHandler();
throw new Error('top-level handler test');
```

or:

```javascript
var lastDitch = require('thehelp-last-ditch');
var err = new Error('just testing things out!');
lastDitch(err);
```

Both of these will log to stderr, `crash.log` in the current working directory, and to `statsd` on the local machine/default port with the metric. Use the `THEHELP_CRASH_LOG` environment variable to set the file path.

_Note: When you set the top-level handler, it will **exit the process** once it has logged the error._

### More targets: SMS and Email

But you probably want to go a little further, send SMS and email. This requires a bit of configuration. You can do it via parameters, but environment variables are the easiest:


```json
{
  "THEHELP_APP_NAME": "YourAppName (so you know what app crashed)",

  "THEHELP_LD_SMS_TO": "a normalized phone number (like +18005551212) to receive SMS reports",
  "THEHELP_LD_SMS_FROM": "a normalized, valid Twilio from number (part of your Twilio account)",

  "THEHELP_LD_EMAIL_TO": "email address for your crash reports",
  "THEHELP_LD_EMAIL_FROM": "who your email crash reports will be from",

  "THEHELP_SENDGRID_USERNAME": "username",
  "THEHELP_SENDGRID_PASSWORD": "password",

  "THEHELP_TWILIO_KEY": "your AccountSID",
  "THEHELP_TWILIO_TOKEN": "your AuthToken",
}
```

Now, with this setup in place, let's set up your top-level handler again:

```javascript
var ld = require('thehelp-last-ditch');

var lastDitch = new ld.LastDitch({
  targets: ld.LastDitch.ALL_TARGETS
});

ld.setupTopLevelHandler({
  go: lastDitch.go
});

throw new Error('messaging test');
```

You can use this same method to change the location of your target `statsd` server: provide a `node-statsd` instance as `options.stats` on creation of your `LastDitch` instance.

_Note: No SMS or email will be sent if `process.env.NODE_ENV === 'development'`_

## Detailed Documentation

Detailed docs be found at this project's GitHub Pages, thanks to `groc`: <http://thehelp.github.io/last-ditch>


## Contributing changes

It's a pretty involved project. You'll need Sendgrid and Twilio accounts, and all the environment variables mentioned above. The unit tests are quick and easy, but the manual test (not part of the `grunt` 'default' task) sends SMS and Email.

When you have some changes ready, please include:

* Justification - why is this change worthwhile? Link to issues, use code samples, etc.
* Documentation changes for your code updates. Be sure to check the groc-generated HTML with `grunt doc`
* A description of how you tested the change. Don't forget about the very-useful `npm link` command :0)

I may ask you to use a `git rebase` to ensure that your commits are not interleaved with commits already in the history. And of course, make sure `grunt` completes successfully (take a look at the requirements for [`thehelp-project`](https://github.com/thehelp/project)). :0)


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
