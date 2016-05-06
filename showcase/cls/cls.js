// Copyright IBM Corp. 2014. All Rights Reserved.
// Node module: async-tracker
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

require('../../');

function Context(curContext){
  if (curContext) {
    this.values = Object.create(curContext.values);
  } else {
    this.values = {};
  }
}

Context.prototype.get = function get(key){
  return this.values[key];
}

Context.prototype.set = function get(key, value){
  this.values[key] = value;
}

function Namespace(_name){
  this.name = 'CLS_' + _name;
}

Namespace.prototype.set = function(key, value) {
  var context = asyncTracker.getListener(this.name);
  context.set(key, value);
}

Namespace.prototype.get = function(key) {
  var context = asyncTracker.getListener(this.name);
  return context.get(key);
}

Namespace.prototype.set = function(key, value) {
  var context = asyncTracker.getListener(this.name);
  return context.set(key, value);
}

Namespace.prototype.run = function(func) {
  var curContext = asyncTracker.getListener(this.name);
  var newContext = new Context(curContext);
  asyncTracker.addListener(newContext, this.name);
  func(newContext);
  asyncTracker.addListener(curContext, this.name);
}

process.namespaces = {}
function createNamespace(name) {
  process.namespaces[name] = new Namespace(name);
  return process.namespaces[name];
}

function getNamespace(name) {
  return process.namespaces[name];
}

function destroyNamespace(name) {
  asyncTracker.removeListener(process.namespaces[name].name);
  delete process.namespaces[name];
}

exports.createNamespace = createNamespace;
exports.getNamespace = getNamespace;
exports.destroyNamespace = destroyNamespace;