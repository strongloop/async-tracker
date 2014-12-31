var assert = require('assert');
var util = require('util');
require('../');

var cnt = 0;
var Listener = function() {
  this.deferredCreated = {};
  this.invokeDeferred = {};
  this.deferredReleased = {};
  var evtName = asyncTracker.events.global.setImmediate;

  this.deferredCreated[evtName] = function(fName, fId) {
    assert.equal(fName, evtName);
    assert.equal(cnt, 0);
    cnt++;
  };

  this.invokeDeferred[evtName] = function(fName, fId, next) {
    assert.equal(fName, evtName);
    assert(false, 'should not be called');
    cnt++;
    next();
  };

  this.deferredReleased[evtName] = function(fName, fId) {
    assert.equal(fName, evtName);
    assert.equal(cnt, 1);
    cnt++;
  };
};

function cb() {
  assert(false, 'should not be called');  
  cnt++;
}

var listener = new Listener();
asyncTracker.addListener(listener, 'listener');
h = setImmediate(cb);
clearImmediate(h);