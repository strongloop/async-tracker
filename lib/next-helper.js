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
