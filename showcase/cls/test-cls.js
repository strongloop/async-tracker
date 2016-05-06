// Copyright IBM Corp. 2014. All Rights Reserved.
// Node module: async-tracker
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

// based on example from readme

cls = require('./cls');
assert = require('assert');

var createNamespace = cls.createNamespace;

function requestHandler() {
  writer.run(function(outer) {
    assert.equal(writer.get('value'), 0);
    assert.equal(outer.get('value'), 0);
    writer.set('value', 1);
    assert.equal(writer.get('value'), 1);
    assert.equal(outer.get('value'), 1);
    process.nextTick(function() {
      assert.equal(writer.get('value'), 1);
      assert.equal(outer.get('value'), 1);
      writer.run(function(inner) {
        assert.equal(writer.get('value'), 1);
        assert.equal(outer.get('value'), 1);
        assert.equal(inner.get('value'), 1);
        writer.set('value', 2);
        assert.equal(writer.get('value'), 2);
        assert.equal(outer.get('value'), 1);
        assert.equal(inner.get('value'), 2);
      });
    });
  });

  setImmediate(function() {
    assert.equal(writer.get('value'), 0);
  });
}

var writer = createNamespace('writer');
writer.run(function () {
  writer.set('value', 0);
  requestHandler();
});

