// Copyright IBM Corp. 2014. All Rights Reserved.
// Node module: async-tracker
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

var assert = require('assert');
require('../index.js');

var cnt=0;
var Listener = function(_expectEvents) {
  var evtName = asyncTracker.events.process.nextTick;
  
  this.deferredCreated = {};
  this.invokeDeferred = {};
  this.deferredReleased = {};

  this.deferredCreated[evtName] = function(fName, fId) {
    assert(_expectEvents);
    cnt++;
  };

  this.invokeDeferred[evtName] = function(fName, fId, next) {
    assert(_expectEvents);
    cnt++;
    next();
  };

  this.deferredReleased[evtName] = function(fName, fId) {
    assert(_expectEvents);
    cnt++;
  };
};

function cb() {
}

var l1 = new Listener(true);
var l2 = new Listener(true);
var l3 = new Listener(false);

asyncTracker.addListener(l1, 'l1');
asyncTracker.addListener(l2, 'l2');
process.nextTick(cb);
asyncTracker.removeListener('l1');
asyncTracker.addListener(l3, 'l3');