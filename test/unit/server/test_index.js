
'use strict';

var test = require('thehelp-test');
var index = require('../../../src/server/index');
var expect = test.core.expect;

describe('thehelp-last-ditch', function() {

  it('works!', function() {
    /*jshint -W030 */
    expect(index).to.exist;
  });

  it('has LastDitch property', function() {
    expect(index).to.have.property('LastDitch').that.exist;
  });

});

