// Copyright IBM Corp. 2014. All Rights Reserved.
// Node module: async-tracker
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

var deferred = require('./deferred.js');
var uid = require('./uid.js');
var nextHelper = require('./next-helper.js');
var RELEASE_CMD = {};

asyncTracker.events.process = {
  nextTick: asyncTracker.generateEventName('process', 'nextTick')
};

var realNextTick = process.nextTick;
process.nextTick = function nextTick(cb) {
  cb = deferred.wrap(asyncTracker.events.process.nextTick, null, cb);
  realNextTick(cb);
};

asyncTracker.events.global = {
  setImmediate: asyncTracker.generateEventName('global', 'setImmediate')
}

var realSetImmediate = global.setImmediate;
var realClearImmediate = global.clearImmediate;

global.setImmediate = function setImmediate() {
  var fn = arguments[0];
  var args = new Array(arguments.length - 1);
  for (var i; i < args.length; i += 1) {
    args[i] = arguments[i + 1];
  }

  var id = uid();
  var savedListener = asyncTracker.listeners;
  var handle;
  var evt = asyncTracker.events.global;

  asyncTracker.deferredCreated(evt.setImmediate, id, null);
  function cb() {
    var curListeners = asyncTracker.listeners;
    asyncTracker.listeners = savedListener;

    if (arguments[0] === RELEASE_CMD) {
      asyncTracker.deferredReleased(evt.setImmediate, id);
      realClearImmediate(handle);
    } else {
      nextHelper.prepareNext(this, fn, args);
      asyncTracker.invokeDeferred(evt.setImmediate, id, nextHelper.next);
      asyncTracker.deferredReleased(evt.setImmediate, id);
    }

    asyncTracker.listeners = curListeners;
  }

  handle = realSetImmediate(cb);
  return cb;
};


global.clearImmediate = function clearImmediate(handle) {
  handle(RELEASE_CMD);
};
