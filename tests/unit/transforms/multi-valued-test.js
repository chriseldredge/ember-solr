import {
  moduleFor,
  test
} from 'ember-qunit';

import Ember from 'ember';
import DS from 'ember-data';
import MultiValuedTransform from 'ember-solr/transforms/multi-valued';

const get = Ember.get,
      set = Ember.set;

moduleFor('transform:multi-valued', 'MultiValuedTransform', {
});

test('deserialize does nothing on correct element type', function(assert) {
  var transform = this.subject();
  set(transform, 'elementType', 'number');

  var result = transform.deserialize([1, NaN, 3]);

  assert.deepEqual(result, [1, NaN, 3], 'Should convert to numbers.');
});

test('deserialize preserves null', function(assert) {
  var transform = this.subject();
  set(transform, 'elementType', 'number');
  set(transform, 'elementTransform', DS.NumberTransform.create());

  var result = transform.deserialize([null, undefined]);

  assert.deepEqual(result, [null, null], 'Should preserve null.');
});

test('deserialize converts undefined to null', function(assert) {
  var transform = this.subject();
  set(transform, 'elementType', 'number');
  set(transform, 'elementTransform', DS.NumberTransform.create());

  var result = transform.deserialize([undefined]);

  assert.deepEqual(result, [null], 'Should convert to null.');
});

test('deserialize converts strings to numbers', function(assert) {
  var transform = this.subject();
  set(transform, 'elementType', 'number');
  set(transform, 'elementTransform', DS.NumberTransform.create());

  var result = transform.deserialize(['1', '3']);

  assert.deepEqual(result, [1, 3], 'Should convert to numbers.');
});

test('deserialize throws on missing element transform', function(assert) {
  var transform = this.subject();
  set(transform, 'elementType', 'fred');

  try {
    transform.deserialize(['1', '3']);
    assert.ok(false, 'Expected error to be thrown.');
  } catch (err) {
    assert.equal("Unable to find transform for 'fred'", err.message);
  }
});

test('serialize does nothing on correct element type', function(assert) {
  var transform = this.subject();
  set(transform, 'elementType', 'number');

  var result = transform.serialize([1, NaN, 3]);

  assert.deepEqual(result, [1, NaN, 3], 'Should convert to numbers.');
});

test('serialize is null safe', function(assert) {
  var transform = this.subject();
  set(transform, 'elementType', 'number');

  var result = transform.serialize(null);

  assert.deepEqual(result, null, 'Should convert to numbers.');
});

test('serialize converts strings to numbers', function(assert) {
  var transform = this.subject();
  set(transform, 'elementType', 'number');
  set(transform, 'elementTransform', DS.NumberTransform.create());

  var result = transform.serialize(['1', '3']);

  assert.deepEqual(result, [1, 3], 'Should convert to numbers.');
});
