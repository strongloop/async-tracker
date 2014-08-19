var assert = require('assert');
var uid = require('../uid.js');
var util = require('util');
var deferred = require('../deferred');
var nextHelper = require('../next-helper');

module.exports = function(binding) {
  var fs = binding('fs');

  /**
   * The FDTracker class tracks open files.
   *
   * @private
   */
  function FDTracker(fd, path) {
    this.fd = fd;
    this.path = path;
  };

  /**
   * Debug function which returns a string with the current state.
   *
   * @return {String}
   */
  FDTracker.prototype.toString = function(options) {
    options = options || {};
    var indent = options.indent || 0;
    var prefix = (new Array(indent + 1)).join('  ');

    return util.format('%s [File        ] #%d (fd: %d, path: %s)\n',
        prefix, this.__id, this.fd, this.path);
  };

  FDTracker.table = [];

  /**
   * Create a new FDTracker and register it with the Zone
   */
  FDTracker.register = function(fd, path) {
    assert(this.table[fd] === undefined);
    var fdTracker = new FDTracker(fd, path);
    this.table[fd] = fdTracker;
    asyncTracker.objectCreated(fdTracker);
    return fdTracker;
  };

  /**
   * Release the FDTracker class
   */
  FDTracker.unregister = function(fd) {
    var fdTracker = this.table[fd];
    assert(fdTracker);
    fdTracker.release();
    delete this.table[fd];
    return fdTracker;
  };

  FDTracker.prototype.release = function() {
    asyncTracker.objectReleased(this);
  }

  /**
   * Helper method to isolate try-catch from optimized code
   */
  function callWrapped(method, thisArg, args) {
    var error, result;
    try {
      result = method.apply(thisArg, args);
    } catch (err) {
      error = err;
    }
    return [result, error];
  }

  // Opening and closing a file descriptor
  var realFsOpen = fs.open;
  fs.open = function open(path, flags, mode) {
    var callbackPos = arguments.length-1;
    var callback = arguments[callbackPos];
    
    // If no callback was specified then call the synchronous binding.
    if (typeof callback !== 'function') {
      var fd = realFsOpen(path, flags, mode);
      if (fd >= 0) {
        FDTracker.register(fd, path);
      }
      return fd;
    }

    var id = uid();
    var savedListener = asyncTracker.listeners;
    asyncTracker.deferredCreated('fs.open', id, {'path': path});
    function openCallback(err, fd) {
      var curListeners = asyncTracker.listeners;
      asyncTracker.listeners = savedListener;

      if (!err && fd >= 0) {
        FDTracker.register(fd, path);
      }

      nextHelper.prepareNext(this, callback, [err, fd]);
      asyncTracker.invokeDeferred('fs.open', id, nextHelper.next);

      asyncTracker.deferredReleased('fs.open', id);
      asyncTracker.listeners = curListeners;
    }

    var result, error;
    result = callWrapped(realFsOpen, this, [path, flags, mode, openCallback]);
    error = result[1];
    result = result[0];

    if (error || result < 0) {
      //release the wrappedCb
      listner.deferredReleased('fs.open', id);
    }

    if (error) {
      throw error;
    } else {
      return result;
    }
  };

  var realFsClose = fs.close;
  fs.close = function close(fd, callback) {
    var fdTracker = FDTracker.unregister(fd);
    
    // If no callback was specified then call the synchronous binding.
    if (typeof callback !== 'function') {
      return realFsClose.apply(this, arguments);
    }

    var wrappedCallback = deferred.wrap('fs.close', {'path': fdTracker.path}, callback);

    var result, error;
    result = callWrapped(realFsClose, this, [fd, wrappedCallback]);
    error = result[1];
    result = result[0];

    if (error || result < 0) {
      deferred.releaseDeferred(callback);
    }

    if (error) {
      throw error;
    } else {
      return result;
    }
  };

  fs.fchmod        = deferred.wrapMethod(fs.fchmod,      {1: 'fd', 2: 'mode'});
  fs.fchown        = deferred.wrapMethod(fs.fchown,      {1: 'fd', 2: 'uid', 3: 'gid'});
  fs.read          = deferred.wrapMethod(fs.read,        {1: 'fd'});
  fs.writeBuffer   = deferred.wrapMethod(fs.writeBuffer, {1: 'fd'});
  fs.writeString   = deferred.wrapMethod(fs.writeString, {1: 'fd'});
  fs.fstat         = deferred.wrapMethod(fs.fstat,       {1: 'fd'});
  fs.fsync         = deferred.wrapMethod(fs.fsync,       {1: 'fd'});
  fs.ftruncate     = deferred.wrapMethod(fs.ftruncate,   {1: 'fd'});
  fs.futimes       = deferred.wrapMethod(fs.futimes,     {1: 'fd'});

  fs.stat          = deferred.wrapMethod(fs.stat,        {1: 'path'});
  fs.link          = deferred.wrapMethod(fs.link,        {1: 'srcpath', 2: 'dstpath'});
  fs.lstat         = deferred.wrapMethod(fs.lstat,       {1: 'path'});
  fs.chmod         = deferred.wrapMethod(fs.chmod,       {1: 'path', 2: 'mode'});
  fs.chown         = deferred.wrapMethod(fs.chown,       {1: 'path', 2: 'uid', 3: 'gid'});
  fs.rename        = deferred.wrapMethod(fs.rename,      {1: 'oldPath', 2: 'newPath'});
  fs.readlink      = deferred.wrapMethod(fs.readlink,    {1: 'path'});
  fs.readdir       = deferred.wrapMethod(fs.readdir,     {1: 'path'});
  fs.unlink        = deferred.wrapMethod(fs.unlink,      {1: 'path'});
  fs.symlink       = deferred.wrapMethod(fs.symlink,     {1: 'srcpath', 2: 'destpath'});
  fs.utimes        = deferred.wrapMethod(fs.utimes,      {1: 'path'});

  return fs;
};
