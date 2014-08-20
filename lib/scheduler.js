var deferred = require('./deferred.js');
var uid = require('./uid.js');
var nextHelper = require('./next-helper.js');
var RELEASE_CMD = {};

var realNextTick = process.nextTick;
process.nextTick = function nextTick(cb) {
  cb = deferred.wrap('nextTick', null, cb);
  realNextTick(cb);
};

var realSetImmediate = global.setImmediate;
var realClearImmediate = global.clearImmediate;

global.setImmediate = function setImmediate() {
  var fn = arguments[0];
  var args = new Array(arguments.length - 1);
  for (var i; i < args.length; i += 1) {
    args[i] = arguments[i + 1];
  }

  var id = uid();
  var savedListener = asyncTracker.listener;
  var handle;

  asyncTracker.deferredCreated('setImmediate', id, null);
  function cb() {
    var curListeners = asyncTracker.listener;
    asyncTracker.listener = savedListener;

    if (arguments[0] === RELEASE_CMD) {
      asyncTracker.deferredReleased('setImmediate', id);
      realClearImmediate(handle);
    } else {
      nextHelper.prepareNext(this, fn, args);
      asyncTracker.invokeDeferred('setImmediate', id, nextHelper.next);
      asyncTracker.deferredReleased('setImmediate', id);
    }

    asyncTracker.listener = curListeners;
  }

  handle = realSetImmediate(cb);
  return cb;
};


global.clearImmediate = function clearImmediate(handle) {
  handle(RELEASE_CMD);
};
