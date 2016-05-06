// Copyright IBM Corp. 2014. All Rights Reserved.
// Node module: async-tracker
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

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

  asyncTracker.events.fs = {
    open: asyncTracker.generateEventName('fs', 'open'),
    close: asyncTracker.generateEventName('fs', 'close'),
    fchmod: asyncTracker.generateEventName('fs', 'fchmod'),     
    fchown: asyncTracker.generateEventName('fs', 'fchown'),
    read: asyncTracker.generateEventName('fs', 'read'),
    writeBuffer: asyncTracker.generateEventName('fs', 'writeBuffer'),
    writeString: asyncTracker.generateEventName('fs', 'writeString'),
    fstat: asyncTracker.generateEventName('fs', 'fstat'),
    fsync: asyncTracker.generateEventName('fs', 'fsync'),
    ftruncate: asyncTracker.generateEventName('fs', 'ftruncate'),
    futimes: asyncTracker.generateEventName('fs', 'futimes'),
    stat: asyncTracker.generateEventName('fs', 'stat'),
    link: asyncTracker.generateEventName('fs', 'link'),
    lstat: asyncTracker.generateEventName('fs', 'lstat'),
    chmod: asyncTracker.generateEventName('fs', 'chmod'),
    chown: asyncTracker.generateEventName('fs', 'chown'),
    rename: asyncTracker.generateEventName('fs', 'rename'),
    readlink: asyncTracker.generateEventName('fs', 'readlink'),
    readdir: asyncTracker.generateEventName('fs', 'readdir'),
    unlink: asyncTracker.generateEventName('fs', 'unlink'),
    symlink: asyncTracker.generateEventName('fs', 'symlink'),
    utimes: asyncTracker.generateEventName('fs', 'utimes')
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
    asyncTracker.deferredCreated(
      asyncTracker.events.fs.open,
      id,
      {'path': path});
    function openCallback(err, fd) {
      var curListeners = asyncTracker.listeners;
      asyncTracker.listeners = savedListener;

      if (!err && fd >= 0) {
        FDTracker.register(fd, path);
      }

      nextHelper.prepareNext(this, callback, [err, fd]);
      asyncTracker.invokeDeferred(
        asyncTracker.events.fs.open,
        id,
        nextHelper.next);

      asyncTracker.deferredReleased(asyncTracker.events.fs.open, id);
      asyncTracker.listeners = curListeners;
    }

    var result, error;
    result = callWrapped(realFsOpen, this, [path, flags, mode, openCallback]);
    error = result[1];
    result = result[0];

    if (error || result < 0) {
      //release the wrappedCb
      listner.deferredReleased(asyncTracker.events.fs.open, id);
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

    var wrappedCallback = deferred.wrap(
      asyncTracker.events.fs.close,
      {'path': fdTracker.path},
      callback);

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

  var evt = asyncTracker.events.fs;
  fs.fchmod = deferred.wrapMethod(evt.fchmod, fs.fchmod, {1: 'fd', 2: 'mode'});
  fs.fchown = deferred.wrapMethod(evt.fchown, fs.fchown, 
    {1: 'fd', 2: 'uid', 3: 'gid'});
  fs.read = deferred.wrapMethod(evt.read, fs.read, {1: 'fd'});
  fs.writeBuffer = deferred.wrapMethod(evt.writeBuffer, fs.writeBuffer,
    {1: 'fd'});
  fs.writeString = deferred.wrapMethod(evt.writeString, fs.writeString,
    {1: 'fd'});
  fs.fstat = deferred.wrapMethod(evt.fstat, fs.fstat, {1: 'fd'});
  fs.fsync = deferred.wrapMethod(evt.fsync, fs.fsync, {1: 'fd'});
  fs.ftruncate = deferred.wrapMethod(evt.ftruncate, fs.ftruncate, {1: 'fd'});
  fs.futimes = deferred.wrapMethod(evt.futimes, fs.futimes, {1: 'fd'});

  fs.stat = deferred.wrapMethod(evt.stat, fs.stat, {1: 'path'});
  fs.link = deferred.wrapMethod(evt.link, fs.link,
    {1: 'srcpath', 2: 'dstpath'});
  fs.lstat = deferred.wrapMethod(evt.lstat, fs.lstat, {1: 'path'});
  fs.chmod = deferred.wrapMethod(evt.chmod, fs.chmod, {1: 'path', 2: 'mode'});
  fs.chown = deferred.wrapMethod(evt.chown, fs.chown,
    {1: 'path', 2: 'uid', 3: 'gid'});
  fs.rename = deferred.wrapMethod(evt.rename, fs.rename,
    {1: 'oldPath', 2: 'newPath'});
  fs.readlink = deferred.wrapMethod(evt.readlink, fs.readlink, {1: 'path'});
  fs.readdir = deferred.wrapMethod(evt.readdir, fs.readdir, {1: 'path'});
  fs.unlink = deferred.wrapMethod(evt.unlink, fs.unlink, {1: 'path'});
  fs.symlink = deferred.wrapMethod(evt.symlink, fs.symlink,
    {1: 'srcpath', 2: 'destpath'});
  fs.utimes = deferred.wrapMethod(evt.utimes, fs.utimes, {1: 'path'});

  return fs;
};
