var assert = require('assert');
require('../index.js');

var cnt=0;
var Listener = function(_expectEvents) {
  this.expectEvents = _expectEvents;
}
Listener.prototype.deferredCreated = function(fName, fId) {
  assert(this.expectEvents);
  cnt++;
}

Listener.prototype.invokeDeferred = function(fName, fId, next) {
  assert(this.expectEvents);
  cnt++;
  next();
}

Listener.prototype.deferredReleased = function(fName, fId) {
  assert(this.expectEvents);
  cnt++;
}

function cb() {
}

var l1 = new Listener(true);
var l2 = new Listener(true);
var l3 = new Listener(false);

asyncTracker.addListener(l1);
asyncTracker.addListener(l2);
process.nextTick(cb);
asyncTracker.removeListener(l1);
asyncTracker.addListener(l3);