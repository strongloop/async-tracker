var assert = require('assert');
var util = require('util');
require('../');

var cnt = 0;
var Listener = function() {
}

Listener.prototype.deferredCreated = function(fName, fId) {
  assert.equal(fName, 'nextTick');
  assert.equal(cnt, 0);
  cnt++;
}

Listener.prototype.invokeDeferred = function(fName, fId, next) {
  assert.equal(fName, 'nextTick');
  assert.equal(cnt, 1);
  cnt++;
  next();
}

Listener.prototype.deferredReleased = function(fName, fId) {
  assert.equal(fName, 'nextTick');
  assert.equal(cnt, 3);
  cnt++;
}

function cb() {
  assert.equal(cnt, 2);
  cnt++;
}

var listener = new Listener();
asyncTracker.addListener(listener);
process.nextTick(cb);
