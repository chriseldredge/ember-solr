import Ember from 'ember';

import {
  moduleFor,
  test
} from 'ember-qunit';

import DS from 'ember-data';
import MultiValuedTransform from 'ember-solr/transforms/multi-valued';
import SolrUpdateMode from 'ember-solr/lib/update-mode';
import NotDirtyError from 'ember-solr/not-dirty-error';

const set = Ember.set;

moduleFor('serializer:atomic', 'AtomicSerializerMixin', {
  needs: ['model:atomic'],
  beforeEach: function() {
    var container = this.container;
    this.register('store:main', DS.Store);
    this.register('transform:string', DS.StringTransform);
    this.register('transform:strings', MultiValuedTransform);
    this.register('transform:boolean', DS.BooleanTransform);
    this.register('transform:number', DS.NumberTransform);

    this.createRecord = function(type, options) {
      return Ember.run(function() {
        options = options || {};
        var isNew = !!options.isNew;
        delete options.isNew;
        var record = container.lookup('store:main').createRecord(type, options);
        delete options.id;

        // make attributes values work in changedAttributes():
        record._preloadData(options);

        set(record, 'currentState.parentState.isNew', isNew);
        return record;
      });
    };

    this.store = this.container.lookup('store:main');
  }
});

test('serialize: atomic set title', function(assert) {
  var oldAttrs = {id: 'atom-1', title: 'an original title'};
  var record = this.createRecord('atomic', oldAttrs);
  Ember.run(function() {
    record.set('title', 'a new title');
  });
  var snapshot = record._createSnapshot();
  var options = {updateMode: SolrUpdateMode.Atomic};

  var result = this.subject().serialize(snapshot, options);

  assert.deepEqual(result, {id: 'atom-1', title: {set: 'a new title'}});
});

test('serialize: atomic set attribute to null', function(assert) {
  var oldAttrs = {id: 'atom-1', title: 'an original title'};
  var record = this.createRecord('atomic', oldAttrs);
  Ember.run(function() {
    record.set('title', null);
  });
  var snapshot = record._createSnapshot();
  var options = {updateMode: SolrUpdateMode.Atomic};

  var result = this.subject().serialize(snapshot, options);

  assert.deepEqual(result, {id: 'atom-1', title: {set: null}});
});

test('serialize: no changes throws NotDirtyError', function(assert) {
  var oldAttrs = {id: 'atom-1', title: 'an original title'};
  var record = this.createRecord('atomic', oldAttrs);
  var snapshot = record._createSnapshot();
  var options = {updateMode: SolrUpdateMode.Atomic};

  try {
    this.subject().serialize(snapshot, options);
    assert.ok(false, 'Expected NotDirtyError to be thrown');
  } catch (err) {
    assert.ok(err instanceof NotDirtyError);
    assert.equal(err.message, "Cannot use atomic update because record of type 'atomic' with id 'atom-1' has no pending changes.", err.message);
  }
});

test('serialize: atomic maps attr to key', function(assert) {
  var oldAttrs = {id: 'atom-1', title: 'an original title'};
  var record = this.createRecord('atomic', oldAttrs);
  Ember.run(function() {
    record.set('title', 'a new title');
  });

  var snapshot = record._createSnapshot();
  var options = {updateMode: SolrUpdateMode.Atomic};

  var serializer = this.subject();
  set(serializer, 'attrs', {title: 'title_str'});
  set(serializer, 'primaryKey', '_id_');

  var result = serializer.serialize(snapshot, options);

  assert.deepEqual(result, {_id_: 'atom-1', title_str: {set: 'a new title'}});
});

test('serialize: array deep equal with order not included', function(assert) {
  var oldAttrs = {id: 'atom-1', categories: Ember.A(['a', 'b'])};
  var record = this.createRecord('atomic', oldAttrs);
  Ember.run(function() {
    record.set('title', 'title two');
    record.set('categories', Ember.A(['a', 'b']));
  });

  var snapshot = record._createSnapshot();
  var options = {updateMode: SolrUpdateMode.Atomic};

  var result = this.subject().serialize(snapshot, options);

  assert.deepEqual(result, {id: 'atom-1', title: {set: 'title two'}});
});

test('serialize: array deep equal with different order included', function(assert) {
  var oldAttrs = {id: 'atom-1', categories: Ember.A(['a', 'b'])};
  var record = this.createRecord('atomic', oldAttrs);
  Ember.run(function() {
    record.set('categories', Ember.A(['b', 'a']));
  });

  var snapshot = record._createSnapshot();
  var options = {updateMode: SolrUpdateMode.Atomic};

  var result = this.subject().serialize(snapshot, options);

  assert.deepEqual(result, {id: 'atom-1', categories: {set: ['b', 'a']}});
});

// TODO: test previousValue is 'a' and new value is ['a', 'b']
// TODO: test previousValue is null and new value is 'a'
// TODO: test previousValue is 'a' and new value is null
// TODO: test previousValue is ['a', 'b'] and new value is 'c';

test('serialize: atomic uses set for array', function(assert) {
  var oldAttrs = {id: 'atom-1', categories: Ember.A(['a', 'b', 'c'])};
  var record = this.createRecord('atomic', oldAttrs);
  Ember.run(function() {
    record.set('categories', Ember.A(['c', 'd', 'e']));
  });

  var snapshot = record._createSnapshot();
  var options = {updateMode: SolrUpdateMode.Atomic};

  var result = this.subject().serialize(snapshot, options);

  assert.deepEqual(result, {id: 'atom-1', categories: {set: ['c', 'd', 'e']}});
});

