// Copyright IBM Corp. 2014. All Rights Reserved.
// Node module: async-tracker
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

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
