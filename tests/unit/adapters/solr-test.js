import Ember from 'ember';
import DS from 'ember-data';
import ConcurrentModificationError from 'ember-solr/concurrent-modification-error';
import SolrCommitType from 'ember-solr/lib/commit-type';
import {
  SolrUpdateHandler
} from 'ember-solr/lib/handlers';

import {
  moduleFor,
  test
} from 'ember-qunit';

import AjaxMock from '../../helpers/ajax-mock';

const get = Ember.get,
      set = Ember.set;

moduleFor('adapter:solr', 'SolrAdapter', {
  needs: ['model:dummy'],
  beforeEach: function() {
    var container = this.container;
    this.register('store:main', DS.Store);
    this.register('serializer:dummy', DS.Serializer.extend({
      versionFieldName: '_version_',
      primaryKey: 'id'
    }));

    set(this.subject(), 'dataType', 'json');

    this.store = container.lookup('store:main');
    this.dummyType = this.store.modelFor('dummy');
    this.dummyType.typeKey = 'dummy';

    var ajaxMock = AjaxMock.create();
    ajaxMock.install();
    this.expectAjax = Ember.run.bind(ajaxMock, ajaxMock.expect);
    this.verifySingleAjaxCall = Ember.run.bind(ajaxMock, ajaxMock.verifySingleAjaxCall);
    this.verifyAjax = Ember.run.bind(ajaxMock, ajaxMock.verifyAll);
    this.ajaxMock = ajaxMock;

    var self = this;
    this.createDummy = function(options) {
      return Ember.run(function() {
        var isNew = !!options.isNew;
        delete options.isNew;
        var record = self.store.createRecord('dummy', options);
        set(record, 'currentState.parentState.isNew', isNew);
        return record;
      });
    };
  },
  afterEach: function() {
    this.ajaxMock.reset();
  }
});

test('find by id uses search handler', function(assert) {
  var self = this;
  var expectedRequestData = {
    q: 'id:101',
    wt: 'json',
  };

  var responseData = { id: 101, title: 'Foo' };
  this.expectAjax('/solr/select', expectedRequestData, responseData);

  var adapter = this.subject();

  return adapter.findRecord(this.store, this.dummyType, 101)
  .then(function(data) {
    self.verifySingleAjaxCall();
    assert.deepEqual(responseData, data, 'response data');
  });
});

test('find by id includes filter query', function() {
  var self = this;
  var expectedRequestData = {
    q: 'id:101',
    wt: 'json',
    fq: 'type:dummy'
  };

  this.expectAjax('/solr/select', expectedRequestData);

  var adapter = this.subject();
  adapter.filterQueryForType = function(type) {
    return 'type:' + type.typeKey;
  };

  return adapter.findRecord(this.store, this.dummyType, 101)
  .then(function() {
    self.verifySingleAjaxCall();
  });
});

test('findMany query multiple ids', function() {
  var self = this;
  var expectedRequestData = {
    q: 'id:(101 OR 102)',
    wt: 'json'
  };

  this.expectAjax('/solr/select', expectedRequestData);

  var adapter = this.subject();

  return adapter.findMany(this.store, this.dummyType, [101, 102])
  .then(function() {
    self.verifySingleAjaxCall();
  });
});

test('query includes start and rows', function() {
  var self = this;
  var expectedRequestData = {
    q: '*:*',
    wt: 'json',
    fl: '*,score',
    rows: 12,
    start: 24
  };

  this.expectAjax('/solr/select', expectedRequestData);

  var adapter = this.subject();

  return adapter.query(this.store, this.dummyType, { limit: 12, offset: 24})
  .then(function() {
    self.verifySingleAjaxCall();
  });
});

test('find by id uses real time get handler', function(assert) {
  var self = this;
  var responseData = { id: 101, title: 'Foo' };
  this.expectAjax('/solr/get', { id: 101 }, responseData);

  var adapter = this.subject();
  set(adapter, 'enableRealTimeGet', true);

  return adapter.findRecord(this.store, this.dummyType, 101)
  .then(function(data) {
    self.verifySingleAjaxCall();
    assert.deepEqual(responseData, data, 'response data');
  });
});

test('buildRequest create uses update handler', function(assert) {
  var adapter = this.subject();
  set(adapter, 'commit', SolrCommitType.None);
  adapter.serialize = function() {
    return {id:'dummy-1'};
  };

  var request = adapter.buildRequest(this.store, this.dummyType, 'createRecord', {id: 'dummy-1'});

  assert.ok(request.handler instanceof SolrUpdateHandler);
});

test('buildRequest update includes commit command', function(assert) {
  var adapter = this.subject();
  set(adapter, 'commit', SolrCommitType.Hard);

  adapter.serialize = function() {
    return {id:'dummy-1'};
  };

  var request = adapter.buildRequest(this.store, this.dummyType, 'updateRecord', {id: 'dummy-1'});

  assert.deepEqual(request.data, {add: {doc: {id: 'dummy-1'}}, commit: {}}, 'request.data');
});

test('buildRequest update includes soft commit command', function(assert) {
  var adapter = this.subject();
  set(adapter, 'commit', SolrCommitType.Soft);

  adapter.serialize = function() {
    return {id:'dummy-1'};
  };

  var request = adapter.buildRequest(this.store, this.dummyType, 'updateRecord', {id: 'dummy-1'});

  assert.deepEqual(request.data, {add: {doc: {id: 'dummy-1'}}, commit: {softCommit: true}}, 'request.data');
});

test('buildRequest update omits commit command', function(assert) {
  var adapter = this.subject();
  set(adapter, 'commit', SolrCommitType.None);
  adapter.serialize = function() {
    return {id:'dummy-1'};
  };

  var request = adapter.buildRequest(this.store, this.dummyType, 'updateRecord', {id: 'dummy-1'});

  assert.deepEqual(request.data, {add: {doc: {id: 'dummy-1'}}}, 'request.data');
});

test('buildRequest update includes commitWithin', function(assert) {
  var adapter = this.subject();
  set(adapter, 'commitWithinMilliseconds', 1234);
  adapter.serialize = function() {
    return {id:'dummy-1'};
  };

  var request = adapter.buildRequest(this.store, this.dummyType, 'updateRecord', {id: 'dummy-1'});

  assert.deepEqual(request.data, {add: {doc: {id: 'dummy-1'}, commitWithin: 1234}}, 'request.data');
});

test('buildRequest update commitWithin takes precedence over commit', function(assert) {
  var adapter = this.subject();
  set(adapter, 'commit', SolrCommitType.Hard);
  set(adapter, 'commitWithinMilliseconds', 1234);
  adapter.serialize = function() {
    return {id:'dummy-1'};
  };

  var request = adapter.buildRequest(this.store, this.dummyType, 'updateRecord', {id: 'dummy-1'});

  assert.deepEqual(request.data, {add: {doc: {id: 'dummy-1'}, commitWithin: 1234}}, 'request.data');
});

test('buildRequest delete includes soft commit command', function(assert) {
  var adapter = this.subject();
  set(adapter, 'commit', SolrCommitType.Soft);

  adapter.serialize = function() {
    return {id:'dummy-1'};
  };

  var request = adapter.buildRequest(this.store, this.dummyType, 'deleteRecord', {id: 'dummy-1'});

  assert.deepEqual(request.data, {delete: {id: 'dummy-1'}, commit: {softCommit: true}}, 'request.data');
});

test('buildRequest delete moves _version_ to query string', function(assert) {
  var adapter = this.subject();

  var data = {id: 'dummy-1', _version_: new BigNumber(12334234324)};

  var request = adapter.buildRequest(this.store, this.dummyType, 'deleteRecord', data);

  assert.equal(get(request, 'handler.path'), 'update?_version_=12334234324', 'request.path');
  assert.deepEqual(request.data, {delete: {id: 'dummy-1'}}, 'request.data');
});

test('buildRequest delete moves _version_=0 to query string', function(assert) {
  var adapter = this.subject();

  var data = {id: 'dummy-1', _version_: 0};

  var request = adapter.buildRequest(this.store, this.dummyType, 'deleteRecord', data);

  assert.equal(get(request, 'handler.path'), 'update?_version_=0', 'request.path');
  assert.deepEqual(request.data, {delete: {id: 'dummy-1'}}, 'request.data');
});

test('updateRecord', function(assert) {
  var self = this;
  var snapshot = this.createDummy({ isNew: false, id: 'dummy-1' })._createSnapshot();
  var updateResponseData = { responseHeader: { status: 0 } };
  var getResponseData = { id: 101, title: 'Foo' };

  this.expectAjax('/solr/update', '{"add":{"doc":{"id":"dummy-1"}}}', updateResponseData);
  this.expectAjax('/solr/get', { id: 'dummy-1' }, getResponseData);

  var adapter = this.subject();
  set(adapter, 'enableRealTimeGet', true);
  adapter.serialize = function() {
    return {id:'dummy-1'};
  };

  return Ember.run(function() {
    return adapter.updateRecord(self.store, self.dummyType, snapshot)
    .then(function(data) {
      self.verifyAjax();
      assert.deepEqual(getResponseData, data, 'response data');
    });
  });
});

test('deleteRecord', function(assert) {
  var self = this;
  var snapshot = this.createDummy({ isNew: false, id: 'dummy-1' })._createSnapshot();
  var updateResponseData = { responseHeader: { status: 0 } };

  this.expectAjax('/solr/update?_version_=1234', '{"delete":{"id":"dummy-1"}}', updateResponseData);

  var adapter = this.subject();
  adapter.serialize = function() {
    return {id:'dummy-1', title: 'something', _version_: 1234};
  };

  return Ember.run(function() {
    return adapter.deleteRecord(self.store, self.dummyType, snapshot)
    .then(function(result) {
      self.verifyAjax();
      assert.deepEqual(result, updateResponseData, 'promise result');
    });
  });
});

test('ajaxOptions jsonp sets stream.body', function(assert) {
  var data = {id: 'foo'};
  var options = {data: data};
  var adapter = this.subject();
  set(adapter, 'dataType', 'jsonp');

  var result = adapter.ajaxOptions('/update', 'POST', options);

  assert.equal(result.jsonp, 'json.wrf', 'result.jsonp');
  assert.equal(result.type, 'GET', 'result.type');
  assert.deepEqual(result.data, {'stream.body': JSON.stringify(data)}, 'result.data');
});

test('ajaxOptions POST stringifies data', function(assert) {
  var data = {id: 'foo'};
  var options = {data: data};
  var adapter = this.subject();

  var result = adapter.ajaxOptions('/update', 'POST', options);

  assert.equal(result.type, 'POST', 'result.type');
  assert.equal(result.contentType, 'application/json; charset=utf-8', 'result.type');
  assert.deepEqual(result.data, JSON.stringify(data), 'result.data');
});

test('updateRecord handles 409 conflict', function(assert) {
  var self = this;
  var snapshot = this.createDummy({ isNew: false, id: 'dummy-1' })._createSnapshot();
  var updateResponseData = {
    responseHeader: { status: 409 },
    error: {
      msg: 'version conflict for dummy-1 expected=1234 actual=5678',
      code: 409
    }
  };

  this.expectAjax('/solr/update', '{"add":{"doc":{"id":"dummy-1"}}}', updateResponseData)
    .withStatusCode(409);

  var adapter = this.subject();
  set(adapter, 'enableRealTimeGet', true);
  adapter.serialize = function() {
    return {id:"dummy-1"};
  };

  return Ember.run(function() {
    return adapter.updateRecord(self.store, self.dummyType, snapshot)
    .then(function() {
      assert.ok(false, 'Should have rejected with DS.InvalidError');
    }).catch(function(err) {
      self.verifyAjax();
      assert.ok(err instanceof ConcurrentModificationError, 'expected to reject with instance of ConcurrentModificationError');
      assert.equal(err.message, updateResponseData.error.msg, 'error.message');
    });
  });
});
