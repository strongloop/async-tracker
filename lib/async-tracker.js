function AsyncTracker() {
  this.listener = [];
  this.listenerGeneration = 0;
  this.hasRef = false;
}

AsyncTracker.prototype.addListener = function(listenerObj) {
  if (!this.hasRef) {
    this.listener.push(listenerObj);
  } else {
    var _listener = this.listener.concat();
    _listener.push(listenerObj);
    this.listener = _listener;
    this.listenerGeneration += 1;
  }
};

AsyncTracker.prototype.removeListener = function(listenerObj) {
  var _listener = this.listener;
  if (this.hasRef) {
    _listener = this.listener.concat();
    this.listenerGeneration += 1;
  }
  _listener.splice(_listener.indexOf(listenerObj), 1);
  this.listener = _listener;
};

AsyncTracker.prototype.deferredCreated = function(fName, cbId, fData) {
  this.hasRef = true;
  var len = this.listener.length;
  for (var i = 0; i < len; i += 1) {
    if (this.listener[i].deferredCreated) {
      this.listener[i].deferredCreated(fName, cbId, fData);
    }
  }
};

var _runItrPos;
var _runList;
var _fName;
var _cbId;
var _next;
function _runDeferred() {
  _runItrPos = _runItrPos + 1;
  if (_runItrPos >= _runList.length) {
    _next();
  } else {
    if (_runList[_runItrPos].invokeDeferred) {
      _runList[_runItrPos].invokeDeferred(_fName, _cbId, _runDeferred);
    } else {
      _runDeferred();
    }
  }
}

AsyncTracker.prototype.invokeDeferred = function(fName, cbId, next) {
  _runItrPos = -1;
  _runList = this.listener;
  _fName = fName;
  _cbId = cbId;
  _next = next;

  _runDeferred();
};

AsyncTracker.prototype.deferredReleased = function(fName, cbId) {
  var len = this.listener.length;
  for (var i = 0; i < len; i += 1) {
    if (this.listener[i].deferredReleased) {
      this.listener[i].deferredReleased(fName, cbId);
    }
  }
};

AsyncTracker.prototype.objectCreated = function(obj) {
  obj._listener = this.listener;
  this.hasRef = true;
  var len = obj._listener.length;
  for (var i = 0; i < len; i += 1) {
    if (obj._listener[i].objectCreated) {
      obj._listener[i].objectCreated(obj);
    }
  }
};

AsyncTracker.prototype.objectReleased = function(obj) {
  var len = obj._listener.length;
  for (var i = 0; i < len; i += 1) {
    if (obj._listener[i].objectReleased) {
      obj._listener[i].objectReleased(obj);
    }
  }
};

if (!global.asyncTracker) {
  global.asyncTracker = new AsyncTracker();
  global.asyncTracker.AsyncTracker = AsyncTracker;
}
