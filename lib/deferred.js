var uid = require('./uid');
var nextHelper = require('./next-helper');
var RELEASE_CMD = {};

function wrap(fName, fArgs, fCallback) {
  var id = uid();
  var savedListener = asyncTracker.listeners;
  asyncTracker.deferredCreated(fName, id, fArgs);
  function fn() {
    var curListeners = asyncTracker.listeners;
    asyncTracker.listeners = savedListener;
    if (arguments[0] !== RELEASE_CMD) {
      asyncTracker.invokeDeferred(fName, id, fCallback);
    }
    asyncTracker.deferredReleased(fName, id);
    asyncTracker.listeners = curListeners;
  }
  return fn;
}

function wrapWithArguments(fName, fArgs, fCallback, callbackArgs) {
  var id = uid();
  var savedListener = asyncTracker.listeners;
  asyncTracker.deferredCreated(fName, id, fArgs);
  function fn() {
    var curListeners = asyncTracker.listeners;
    asyncTracker.listeners = savedListener;
    if (arguments[0] !== RELEASE_CMD) {
      nextHelper.prepareNext(this, fCallback, callbackArgs);
      asyncTracker.invokeDeferred(fName, id, nextHelper.next);
    }
    asyncTracker.deferredReleased(fName, id);
    asyncTracker.listeners = curListeners;
  }
  return fn;
}

function releaseDeferred(fn) {
  fn(RELEASE_CMD);
}

/**
 * Wrap a method so it follows AsyncTracker symantics. The callback is assumed to be the last argument.
 * Only async invocations (with a callback) will generate events
 *
 * @parameter method The method to wrap
 * @parameter argMap A map of position -> argument name which should be passed to the listener
 */
function wrapMethod(method, argMap) {
  return function() {
    var callbackPos = arguments.length-1;
    
    // If the method is called synchronously, call the function directly.
    if (typeof arguments[callbackPos] !== 'function') {
      return method.apply(this, arguments);
    }

    // Capture the original arguments and the callback.
    var args = new Array(arguments.length);
    var sArgs = {};
    for (var i = 0; i < arguments.length; i += 1) {
      args[i] = arguments[i];
      if (argMap[i]) {
        sArgs[argMap[i]] = arguments[i];
      }
    }
    var callback = args[callbackPos];

    args[callbackPos] = wrap(method.name, sArgs, callback);
    return method.apply(this, args);
  };
}

exports.wrapWithArguments = wrapWithArguments;
exports.wrap = wrap;
exports.releaseDeferred = releaseDeferred;
exports.wrapMethod = wrapMethod;
