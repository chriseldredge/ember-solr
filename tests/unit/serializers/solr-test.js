import {
  moduleFor,
  test
} from 'ember-qunit';

import Ember from 'ember';
import DS from 'ember-data';
import SolrStore from 'ember-solr/services/store';
import SolrUpdateMode from 'ember-solr/lib/update-mode';
import NotFoundError from 'ember-solr/not-found-error';
import TooManyResultsError from 'ember-solr/too-many-results-error';

const set = Ember.set;

moduleFor('serializer:solr', 'SolrSerializer', {
  needs: ['model:dummy'],
  beforeEach: function() {
    var container = this.container;
    this.register('store:main', SolrStore);
    this.register('transform:string', DS.StringTransform);
    this.register('transform:boolean', DS.BooleanTransform);
    this.register('transform:number', DS.NumberTransform);

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
    this.dummyType = this.store.modelFor('dummy');

    this.buildExpectedData = function(id, attributes, relationships, type, meta) {
      return {
        id: id,
        attributes: attributes || {},
        relationships: relationships || {},
        type: type || 'dummy',
        meta: meta || {}
      };
    };
  }
});

test('normalizeResponse meta total', function(assert) {
  var serializer = this.subject();
  var payload = {
    response: {
      numFound: 37,
      docs: []
    }
  };

  var result = serializer.normalizeResponse(this.store, this.dummyType, payload, null, 'query');
  var meta = result.meta;

  assert.equal(meta.total, 37, 'meta.total');
});

test('normalizeResponse meta offset', function(assert) {
  var serializer = this.subject();
  var payload = {
    response: {
      start: 40,
      docs: []
    }
  };

  var result = serializer.normalizeResponse(this.store, this.dummyType, payload, null, 'query');
  var meta = result.meta;

  assert.equal(meta.offset, 40, 'meta.offset');
});

test('normalizeResponse document versions', function(assert) {
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

  var result = serializer.normalizeResponse(this.store, this.dummyType, payload, null, 'query');
  var data = result.data;

  assert.equal(data[0].meta.version, 1234, 'data[0].version');
  assert.equal(data[1].meta.version, 5678, 'data[1].version');
});

test('normalizeResponse single document version', function(assert) {
  var serializer = this.subject();
  var payload = {
    doc: {
      id: 1,
      _version_: 1234
    }
  };

  var result = serializer.normalizeResponse(this.store, this.dummyType, payload, null, 'findRecord');
  var data = result.data;

  assert.equal(data.meta.version, 1234, 'data.versions[1]');
});

test('normalizeResponse findRecord doc', function(assert) {
  var serializer = this.subject();
  var payload = {doc: {id: '12' }};

  var result = serializer.normalizeResponse(this.store, this.dummyType, payload, payload.doc.id, 'findRecord');
  var expected = this.buildExpectedData('12');
  assert.deepEqual(result.data, expected);
});

test('normalizeResponse findRecord doc not found', function(assert) {
  var serializer = this.subject();
  var id = '13';
  var payload = {doc: null};

  try {
    serializer.normalizeResponse(this.store, this.dummyType, payload, id, 'findRecord');
    assert.ok(false, 'Expected error to be thrown');
  } catch (err) {
    assert.ok(err instanceof NotFoundError, 'Expected NotFoundError to be thrown');
    assert.equal(err.id, id, 'err.id');
    assert.equal(err.type, 'dummy', 'err.type');
  }
});

test('normalizeResponse findRecord response.docs', function(assert) {
  var serializer = this.subject();
  var payload = {response: {docs: [{id: '12' }]}};

  var result = serializer.normalizeResponse(this.store, this.dummyType, payload, '12', 'findRecord');
  var expected = this.buildExpectedData('12');

  assert.deepEqual(result.data, expected);
});

test('normalizeResponse findRecord response.docs not found', function(assert) {
  var serializer = this.subject();
  var type = this.createDummy().get('constructor');
  var id = '13';
  var payload = {response: {docs: []}};

  try {
    serializer.normalizeResponse(this.store, type, payload, id, 'findRecord');
    assert.ok(false, 'Expected error to be thrown');
  } catch (err) {
    assert.ok(err instanceof NotFoundError, 'Expected NotFoundError to be thrown');
    assert.equal(err.id, id, 'err.id');
    assert.equal(err.type, 'dummy', 'err.type');
  }
});

test('normalizeResponse findRecord response.docs not single', function(assert) {
  var serializer = this.subject();
  var type = this.createDummy().get('constructor');
  var id = '13';
  var payload = {response: {docs: [{}, {}, {}]}};

  try {
    serializer.normalizeResponse(this.store, type, payload, id, 'findRecord');
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

  record._internalModel._meta.version = 1563456;
  var options = { updateMode: SolrUpdateMode.OptimisticConcurrency };

  var result = serializer.serialize(snapshot, options);

  assert.deepEqual(result, {title: 'My Dummy', flags: 37, _version_: 1563456});
});

test('serialize optimistic: update record throws on missing version', function(assert) {
  var serializer = this.subject();
  var snapshot = this.createDummy({ id: 532, title: 'My Dummy', flags: 37, isNew: false })._createSnapshot();
  var options = { updateMode: SolrUpdateMode.OptimisticConcurrency };

  try {
    serializer.serialize(snapshot, options);
    assert.ok(false, 'Expected error to be thrown.');
  } catch (err) {
    assert.equal(err.message, 'Missing document version for record id 532 of type "dummy".', 'err.message');
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

test('serialize deletes null', function(assert) {
  var serializer = this.subject();
  var snapshot = this.createDummy({ title: 'My Dummy' })._createSnapshot();

  var result = serializer.serialize(snapshot);

  assert.deepEqual(result, {title: 'My Dummy'});
});

test('serialize deletes empty string', function(assert) {
  var serializer = this.subject();
  var snapshot = this.createDummy({ title: '', flags: 42 })._createSnapshot();

  var result = serializer.serialize(snapshot);

  assert.deepEqual(result, {flags: 42});
});

test('serialize preserves falsy', function(assert) {
  var serializer = this.subject();
  var snapshot = this.createDummy({ flags: 0 })._createSnapshot();

  var result = serializer.serialize(snapshot);

  assert.deepEqual(result, {flags: 0});
});
