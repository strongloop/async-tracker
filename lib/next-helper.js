// Copyright IBM Corp. 2014. All Rights Reserved.
// Node module: async-tracker
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

var context = null;
var callback = null;
var callbackArgs = null;
function next() {
  callback.apply(context, callbackArgs);
}

function prepareNext(_context, cb, args){
  context = _context;
  callback = cb;
  callbackArgs = args;
}

exports.next = next;
exports.prepareNext = prepareNext;
