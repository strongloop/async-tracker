// Copyright IBM Corp. 2014. All Rights Reserved.
// Node module: async-tracker
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

var uidCounter = 0;
function uid() {
  uidCounter += 1;
  return uidCounter;
}

module.exports = uid;
