var assert = require('assert');
require('../index.js');
var fs = require('fs');
var util = require('util');
var cnt = 0;

var Listener = function() {
}

Listener.prototype.deferredCreated = function(fName, fId, args) {
  if (fName === 'fs.open') {
    assert.equal(cnt, 0);
  } else {
    assert.equal(cnt, 4);
  }
  cnt += 1;
}

Listener.prototype.invokeDeferred = function(fName, fId, next) {
  if (fName === 'fs.open') {
    assert.equal(cnt, 2);
  } else {
    assert.equal(cnt, 6);
  }
  cnt += 1;
  next();
}

Listener.prototype.deferredReleased = function(fName, fId) {
  if (fName === 'fs.open') {
    assert.equal(cnt, 5);
  } else {
    assert.equal(cnt, 7);
  }
  cnt += 1;
}

Listener.prototype.objectCreated = function(obj) {
  assert.equal(cnt, 1);
  cnt += 1;
}

Listener.prototype.objectReleased = function(obj) {
  assert.equal(cnt, 3);
  cnt += 1;
}

var listener = new Listener();
asyncTracker.addListener(listener, 'listener');

function closeCallback() {
}

function openCallback(err, fd) {
  fs.close(fd, closeCallback);
}

fs.open(__filename, 'r', openCallback);
asyncTracker.removeListener('listener');