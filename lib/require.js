var Module = require('module').Module;
var NativeModule = require('./node-lib/native_module');

var realRequire = Module.prototype.require;
Module.prototype._realRequire = realRequire;

function load(path) {
  switch (path) {
    case 'buffer':
      return realRequire.apply(this, arguments);
    default:
      if (NativeModule.exists(path)) {
        return NativeModule.require(path);
      }
      return realRequire.apply(this, arguments);
  }
}

Module.prototype.require = load;
