import {
  moduleFor,
  test
} from 'ember-qunit';

import Ember from 'ember';
import DS from 'ember-data';

import SolrDynamicSerializer from 'dummy/serializers/dynamic';

const set = Ember.set;

moduleFor('serializer:dynamic', 'SolrDynamicSerializer', {
  needs: ['model:dummy'],
  beforeEach: function() {
    var container = this.container;
    this.register('store:main', DS.Store);
    this.register('transform:string', DS.StringTransform);
    this.register('transform:number', DS.NumberTransform);

    this.createDummy = function(options) {
      return Ember.run(function() {
        return container.lookup('store:main').createRecord('dummy', options);
      });
    };

    this.dummyType = this.container.lookupFactory('model:dummy');
  }
});

test('normalize string', function(assert) {
  var serializer = this.subject();
  var result = serializer.normalize(this.dummyType, { title_s: 'a title'});
  assert.deepEqual(result.data.attributes, {title: 'a title'});
});

test('normalize int', function(assert) {
  var serializer = this.subject();
  var result = serializer.normalize(this.dummyType, { flags_i: 42});
  assert.deepEqual(result.data.attributes, { flags: 42 });
});

test('normalize int with prefix', function(assert) {
  var serializer = this.subject();
  set(serializer, 'dynamicFieldPrefixes', { 'number': 'int_'} );
  set(serializer, 'dynamicFieldSuffixes', null);

  var result = serializer.normalize(this.dummyType, { int_flags: 42});
  assert.deepEqual(result.data.attributes, { flags: 42 });
});

test('normalize with attr mapping', function(assert) {
  var serializer = this.subject();
  set(serializer, 'attrs', { title: 'a_special_title' });

  var result = serializer.normalize(this.dummyType, { a_special_title: 'a title'});
  assert.deepEqual(result.data.attributes, { title: 'a title' });
});

test('serialize string', function(assert) {
  var serializer = this.subject();
  var snapshot = this.createDummy({ title: 'My Dummy', flags: 37 })._createSnapshot();

  var result = serializer.serialize(snapshot);

  assert.deepEqual(result, {title_s: 'My Dummy', flags_i: 37});
});

test('override suffix concatenates hash', function(assert) {
  var ser = SolrDynamicSerializer.create({
    dynamicFieldSuffixes: { string: '(string)' }
  });

  ser.currentType = {
    metaForProperty: function() {
      return { type: 'string' };
    }
  };

  assert.equal(ser.keyForAttribute('bar'), 'bar(string)', 'Should use custom key suffix');
});
