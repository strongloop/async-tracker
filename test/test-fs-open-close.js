// Copyright IBM Corp. 2014. All Rights Reserved.
// Node module: async-tracker
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

var assert = require('assert');
require('../index.js');
var fs = require('fs');
var util = require('util');
var cnt = 0;

var Listener = function() {
  var evtName = asyncTracker.events.fs.open;

  this.deferredCreated = {};
  this.invokeDeferred = {};
  this.deferredReleased = {};

  this.deferredCreated[evtName] = function(fName, fId, args) {
    assert.equal(cnt, 0);
    cnt += 1;
  };

  this.deferredCreated['default'] = function(fName, fId, args) {
    assert.equal(cnt, 4);
    cnt += 1;
  };

  this.invokeDeferred[evtName] = function(fName, fId, next) {
    assert.equal(cnt, 2);
    cnt += 1;
    next();
  };

  this.invokeDeferred['default'] = function(fName, fId, next) {
    assert.equal(cnt, 6);
    cnt += 1;
    next();
  };

  this.deferredReleased[evtName] = function(fName, fId) {
    assert.equal(cnt, 5);
    cnt += 1;
  };

  this.deferredReleased['default'] = function(fName, fId) {
    assert.equal(cnt, 7);
    cnt += 1;
  };

  this.objectCreated = function(obj) {
    assert.equal(cnt, 1);
    cnt += 1;
  };

  this.objectReleased = function(obj) {
    assert.equal(cnt, 3);
    cnt += 1;
  };
};

var listener = new Listener();
asyncTracker.addListener(listener, 'listener');

function closeCallback() {
}

function openCallback(err, fd) {
  fs.close(fd, closeCallback);
}

fs.open(__filename, 'r', openCallback);
asyncTracker.removeListener('listener');