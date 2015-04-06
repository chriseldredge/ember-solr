import {
  moduleFor,
  test
} from 'ember-qunit';

import Ember from 'ember';
import DS from 'ember-data';
import SolrUpdateMode from 'ember-solr/lib/update-mode';
import NotFoundError from 'ember-solr/not-found-error';
import TooManyResultsError from 'ember-solr/too-many-results-error';

const set = Ember.set,
      get = Ember.get;

moduleFor('serializer:solr', 'SolrSerializer', {
  needs: ['model:dummy'],
  beforeEach: function() {
    var container = this.container;
    container.register('store:main', DS.Store);
    container.register('transform:string', DS.StringTransform);
    container.register('transform:number', DS.NumberTransform);

    this.createDummy = function(options) {
      return Ember.run(function() {
        options = options || {};
        var isNew = !!options.isNew;
        delete options.isNew;
        var record = container.lookup('store:main').createRecord('dummy', options);
        set(record, 'currentState.parentState.isNew', isNew);
        return record;
      });
    };

    this.store = this.container.lookup('store:main');
    this.dummyType = this.container.lookupFactory('model:dummy');
  }
});

test('extractMeta numFound', function(assert) {
  var serializer = this.subject();
  var payload = {
    response: {
      numFound: 37
    }
  };

  serializer.extractMeta(this.store, this.dummyType, payload);
  var meta = this.store.metadataFor('dummy');

  assert.equal(meta.total, 37, 'meta.total');
});

test('extractMeta offset', function(assert) {
  var serializer = this.subject();
  var payload = {
    response: {
      start: 40
    }
  };

  serializer.extractMeta(this.store, this.dummyType, payload);
  var meta = this.store.metadataFor('dummy');

  assert.equal(meta.offset, 40, 'meta.offset');
});

test('extractMeta document versions', function(assert) {
  var serializer = this.subject();
  var payload = {
    response: {
      docs: [
        {
          id: 1,
          _version_: 1234
        },
        {
          id: 2,
          _version_: 5678
        }
      ]
    }
  };

  serializer.extractMeta(this.store, this.dummyType, payload);
  var meta = this.store.metadataFor('dummy');

  assert.equal(meta.versions[1], 1234, 'meta.versions[1]');
  assert.equal(meta.versions[2], 5678, 'meta.versions[2]');
});

test('extractMeta single document version', function(assert) {
  var serializer = this.subject();
  var payload = {
    doc: {
      id: 1,
      _version_: 1234
    }
  };

  serializer.extractMeta(this.store, this.dummyType, payload);
  var meta = this.store.metadataFor('dummy');

  assert.equal(meta.versions[1], 1234, 'meta.versions[1]');
});

test('extractSingle doc', function(assert) {
  var serializer = this.subject();
  var payload = {doc: {id: '12' }};

  var result = serializer.extractSingle(this.store, this.dummyType, payload, payload.doc.id, 'find');

  assert.deepEqual(result, {id: '12'});
});

test('extractSingle doc not found', function(assert) {
  var serializer = this.subject();
  var type = this.createDummy().get('constructor');
  var id = '13';
  var payload = {doc: null};

  try {
    serializer.extractSingle(this.store, type, payload, id, 'find');
    assert.ok(false, 'Expected error to be thrown');
  } catch (err) {
    assert.ok(err instanceof NotFoundError, 'Expected NotFoundError to be thrown');
    assert.equal(err.id, id, 'err.id');
    assert.equal(err.type, 'dummy', 'err.type');
  }
});

test('extractSingle response.docs', function(assert) {
  var serializer = this.subject();
  var payload = {response: {docs: [{id: '12' }]}};

  var result = serializer.extractSingle(this.store, this.dummyType, payload, '12', 'find');

  assert.deepEqual(result, {id: '12'});
});

test('extractSingle response.docs not found', function(assert) {
  var serializer = this.subject();
  var type = this.createDummy().get('constructor');
  var id = '13';
  var payload = {response: {docs: []}};

  try {
    serializer.extractSingle(this.store, type, payload, id, 'find');
    assert.ok(false, 'Expected error to be thrown');
  } catch (err) {
    assert.ok(err instanceof NotFoundError, 'Expected NotFoundError to be thrown');
    assert.equal(err.id, id, 'err.id');
    assert.equal(err.type, 'dummy', 'err.type');
  }
});

test('extractSingle response.docs not single', function(assert) {
  var serializer = this.subject();
  var type = this.createDummy().get('constructor');
  var id = '13';
  var payload = {response: {docs: [{}, {}, {}]}};

  try {
    serializer.extractSingle(this.store, type, payload, id, 'find');
    assert.ok(false, 'Expected error to be thrown');
  } catch (err) {
    assert.ok(err instanceof TooManyResultsError, 'Expected TooManyResultsError to be thrown');
    assert.equal(err.id, id, 'err.id');
    assert.equal(err.type, 'dummy', 'err.type');
    assert.equal(err.count, 3, 'err.count');
  }
});

test('serialize optimistic: new record', function(assert) {
  var serializer = this.subject();
  var snapshot = this.createDummy({ title: 'My Dummy', flags: 37, isNew: true })._createSnapshot();
  var options = { updateMode: SolrUpdateMode.OptimisticConcurrency };

  var result = serializer.serialize(snapshot, options);

  assert.deepEqual(result, {title: 'My Dummy', flags: 37, _version_: -1});
});

test('serialize optimistic: update record', function(assert) {
  var serializer = this.subject();
  var record = this.createDummy({ title: 'My Dummy', flags: 37, id: 'doc-id-1234', isNew: false });
  var snapshot = record._createSnapshot();

  this.store.setMetadataFor(snapshot.type, { versions: { 'doc-id-1234': 1563456 }});
  var options = { updateMode: SolrUpdateMode.OptimisticConcurrency };

  var result = serializer.serialize(snapshot, options);

  assert.deepEqual(result, {title: 'My Dummy', flags: 37, _version_: 1563456});
});

test('serialize optimistic: update record throws on missing version', function(assert) {
  var serializer = this.subject();
  var snapshot = this.createDummy({ title: 'My Dummy', flags: 37, isNew: false })._createSnapshot();
  this.store.setMetadataFor(snapshot.type, {});
  var options = { updateMode: SolrUpdateMode.OptimisticConcurrency };

  try {
    serializer.serialize(snapshot, options);
    assert.ok(false, 'Expected error to be thrown.');
  } catch (err) {
    assert.equal(err.message, 'Missing metadata for record type `dummy`', 'err.message');
  }
});

test('serialize last-write-wins', function(assert) {
  var serializer = this.subject();
  var snapshot = this.createDummy({ title: 'My Dummy', flags: 37, isNew: false })._createSnapshot();
  var options = { updateMode: SolrUpdateMode.LastWriteWins };

  var result = serializer.serialize(snapshot, options);

  assert.deepEqual(result, {title: 'My Dummy', flags: 37, _version_: 0});
});

test('serialize default omits _version_', function(assert) {
  var serializer = this.subject();
  var snapshot = this.createDummy({ title: 'My Dummy', flags: 37 })._createSnapshot();

  var result = serializer.serialize(snapshot);

  assert.deepEqual(result, {title: 'My Dummy', flags: 37});
});
