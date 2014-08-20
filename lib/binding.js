var realBinding = process.binding;
var bindingCache = {};

function binding(name) {
  if (name in bindingCache){
    return bindingCache[name];
  }

  var wb;
  switch (name) {
    // case 'pipe_wrap':
    // case 'tcp_wrap':
    // case 'tty_wrap':
    //   var wb = require('./binding/stream-wrap.js')(realBinding);
    //   bindingCache.pipe_wrap = wb;
    //   bindingCache.tcp_wrap = wb;
    //   bindingCache.tty_wrap = wb;
    //   return wb;

    // case 'cares_wrap':
    //   var wb = require('./bindings/cares-wrap.js')(realBinding);
    //   bindingCache.cares_wrap = wb;
    //   return wb;

    case 'fs':
      wb = require('./bindings/fs.js')(realBinding);
      bindingCache.fs = wb;
      return wb;

    // case 'process_wrap':
    //   var wb = require('./binding/process-wrap.js')(realBinding);
    //   bindingCache.process_wrap = wb;
    //   return wb;

    default:
      return realBinding(name);
  }
}

process.binding = binding;
