uid = require('./uid');

function AsyncTracker() {
  this.listeners = {};
  this.listenerGeneration = 0;
  this.hasRef = false;
  this.events = {};
}

function _copyListeners(listeners, removeListener) {
  var listenersCopy = {};
  var keys = Object.keys(listeners);
  var len = keys.length;
  for (var i=0; i<len; i += 1) {
    if (removeListener && keys[i] != removeListener) {
      continue;
    }
    listenersCopy[keys[i]] = listeners[keys[i]];
  }
  return listenersCopy;
}

AsyncTracker.prototype.generateEventName = function(module, name) {
  return uid();
}

AsyncTracker.prototype.addListener = function(listenerObj, name) {
  name = name || 'async_listener_' + uid();
  if (this.hasRef || this.listeners[name]) {
    this.listeners = _copyListeners(this.listeners);
    this.listenerGeneration += 1;
  }
  this.listeners[name] = listenerObj;
  return name;
};

AsyncTracker.prototype.removeListener = function(name) {
  if (!this.listeners[name]) {
    return;
  }
  if (this.hasRef) {
    this.listeners = _copyListeners(this.listeners);
  }
  delete this.listeners[name];
};

AsyncTracker.prototype.getListener = function(name) {
  return this.listeners[name];
}

AsyncTracker.prototype.deferredCreated = function(fName, cbId, fData) {
  this.hasRef = true;
  var keys = Object.keys(this.listeners);
  var len = keys.length;
  for (var i = 0; i < len; i += 1) {
    var fn = this.listeners[keys[i]].deferredCreated[fName];
    if (!fn && this.listeners[keys[i]].deferredCreated['default']) {
      fn = this.listeners[keys[i]].deferredCreated['default'];
    }

    if (fn) fn(fName, cbId);
  }
};

var _runItrPos;
var _runList;
var _runListKeys;
var _fName;
var _cbId;
var _next;
function _runDeferred() {
  _runItrPos = _runItrPos + 1;
  if (_runItrPos >= _runListKeys.length) {
    _next();
  } else {
    var curListener = _runList[_runListKeys[_runItrPos]];
    if (curListener.invokeDeferred[_fName]) {
      curListener.invokeDeferred[_fName](_fName, _cbId, _runDeferred);
    } else if(curListener.invokeDeferred['default']) {
      curListener.invokeDeferred['default'](_fName, _cbId, _runDeferred);
    } else {
      _runDeferred();
    }
  }
}

AsyncTracker.prototype.invokeDeferred = function(fName, cbId, next) {
  _runItrPos = -1;
  _runList = this.listeners;
  _runListKeys = Object.keys(this.listeners);
  _fName = fName;
  _cbId = cbId;
  _next = next;

  _runDeferred();
};

AsyncTracker.prototype.deferredReleased = function(fName, cbId) {
  var keys = Object.keys(this.listeners);
  var len = keys.length;
  for (var i = 0; i < len; i += 1) {
    var fn = this.listeners[keys[i]].deferredReleased[fName];
    if (!fn && this.listeners[keys[i]].deferredReleased['default']) {
      fn = this.listeners[keys[i]].deferredReleased['default'];
    }

    if (fn) fn(fName, cbId);
  }
};

AsyncTracker.prototype.objectCreated = function(obj) {
  obj._listeners = this.listeners;
  this.hasRef = true;
  
  var keys = Object.keys(obj._listeners);
  var len = keys.length;
  for (var i = 0; i < len; i += 1) {
    if (obj._listeners[keys[i]].objectCreated) {
      obj._listeners[keys[i]].objectCreated(obj);
    }
  }
};

AsyncTracker.prototype.objectReleased = function(obj) {
  var keys = Object.keys(obj._listeners);
  var len = keys.length;
  for (var i = 0; i < len; i += 1) {
    if (obj._listeners[keys[i]].objectReleased) {
      obj._listeners[keys[i]].objectReleased(obj);
    }
  }
};

if (!global.asyncTracker) {
  global.asyncTracker = new AsyncTracker();
  global.asyncTracker.AsyncTracker = AsyncTracker;
}
