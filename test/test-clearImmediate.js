var assert = require('assert');
var util = require('util');
require('../');

var cnt = 0;
var Listener = function() {
}

Listener.prototype.deferredCreated = function(fName, fId) {
  assert.equal(fName, 'setImmediate');
  assert.equal(cnt, 0);
  cnt++;
}

Listener.prototype.invokeDeferred = function(fName, fId, next) {
  assert.equal(fName, 'setImmediate');
  assert(false, 'should not be called');
  cnt++;
  next();
}

Listener.prototype.deferredReleased = function(fName, fId) {
  assert.equal(fName, 'setImmediate');
  assert.equal(cnt, 1);
  cnt++;
}

function cb() {
  assert(false, 'should not be called');  
  cnt++;
}

var listener = new Listener();
asyncTracker.addListener(listener, 'listener');
h = setImmediate(cb);
clearImmediate(h);