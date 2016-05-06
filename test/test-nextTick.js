// Copyright IBM Corp. 2014. All Rights Reserved.
// Node module: async-tracker
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

var assert = require('assert');
var util = require('util');
require('../');

var cnt = 0;
var Listener = function() {
  var evtName = asyncTracker.events.process.nextTick;

  this.deferredCreated = {};
  this.invokeDeferred = {};
  this.deferredReleased = {};

  this.deferredCreated[evtName] = function(fName, fId) {
    assert.equal(fName, evtName);
    assert.equal(cnt, 0);
    cnt++;
  };

  this.invokeDeferred[evtName] = function(fName, fId, next) {
    assert.equal(fName, evtName);
    assert.equal(cnt, 1);
    cnt++;
    next();
  };

  this.deferredReleased[evtName] = function(fName, fId) {
    assert.equal(fName, asyncTracker.events.process.nextTick);
    assert.equal(cnt, 3);
    cnt++;
  };
};

function cb() {
  assert.equal(cnt, 2);
  cnt++;
}

var listener = new Listener();
asyncTracker.addListener(listener, 'listener');
process.nextTick(cb);
