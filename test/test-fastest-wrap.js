// This test checks that setting up module globals is faster than creating a  
// closure to store context.

var assert = require('assert');

function dummy(a1, a2) {
  return a1 + a2;
}



function closureApproach(){
  (function() {
    dummy.apply(this, arguments);
  }) ('foo', 'bar');
}

var iterations=1e7;
var t1 = process.hrtime();
for (var i=iterations; i>0; i=i-1) {
  closureApproach();
}
var diff = process.hrtime(t1);
diffClosure = diff[0] * 1e9 + diff[1];



var context = null;
var callback = null;
var callbackArgs = null;
function next() {
  callback.apply(context, callbackArgs);
}

function parameterApproach(){
  context = this;
  callback = dummy;
  callbackArgs = new Array(2);
  callbackArgs[0] = 'foo';
  callbackArgs[1] = 'bar';
  
  next();
  
  context = null;
  callback = null;
  callbackArgs = null;
}

t2 = process.hrtime();
for (var i=iterations; i>0; i=i-1) {
  parameterApproach();
}
diff = process.hrtime(t1);
diffPrepareNext = diff[0] * 1e9 + diff[1];



assert(diffPrepareNext > diffClosure);
