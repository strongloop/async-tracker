var uidCounter = 0;
function uid() {
  uidCounter += 1;
  return uidCounter;
}

module.exports = uid;
