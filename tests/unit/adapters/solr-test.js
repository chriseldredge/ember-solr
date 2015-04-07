import Ember from 'ember';
import DS from 'ember-data';
import ConcurrentModificationError from 'ember-solr/concurrent-modification-error';

import {
  moduleFor,
  test
} from 'ember-qunit';

import QUnit from 'qunit';

import AjaxMock from '../../helpers/ajax-mock';

const get = Ember.get,
      set = Ember.set;

moduleFor('adapter:solr', 'SolrAdapter', {
  needs: ['model:dummy'],
  beforeEach: function() {
    var container = this.container;
    container.register('store:main', DS.Store);

    set(this.subject(), 'dataType', 'json');

    this.store = container.lookup('store:main');
    this.dummyType = container.lookupFactory('model:dummy');
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

  return adapter.find(this.store, this.dummyType, 101)
  .then(function(data) {
    self.verifySingleAjaxCall();
    assert.deepEqual(responseData, data, 'response data');
  });
});

test('find by id includes filter query', function(assert) {
  var self = this;
  var expectedRequestData = {
    q: 'id:101',
    wt: 'json',
    fq: 'type:dummy'
  };

  this.expectAjax('/solr/select', expectedRequestData);

  var adapter = this.subject();
  adapter.filterQueryForType = function(type) {
    return 'type:' + type;
  };

  return adapter.find(this.store, this.dummyType, 101)
  .then(function() {
    self.verifySingleAjaxCall();
  });
});

test('findQuery includes start and rows', function(assert) {
  var self = this;
  var expectedRequestData = {
    q: '*:*',
    wt: 'json',
    rows: 12,
    start: 24
  };

  this.expectAjax('/solr/select', expectedRequestData);

  var adapter = this.subject();

  return adapter.findQuery(this.store, this.dummyType, { limit: 12, offset: 24})
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

  return adapter.find(this.store, this.dummyType, 101)
  .then(function(data) {
    self.verifySingleAjaxCall();
    assert.deepEqual(responseData, data, 'response data');
  });
});

test('updateRecord', function(assert) {
  var self = this;
  var snapshot = this.createDummy({ isNew: false, id: 'dummy-1' })._createSnapshot();
  var updateResponseData = { responseHeader: { status: 0 } };
  var getResponseData = { id: 101, title: 'Foo' };

  this.expectAjax('/solr/update', JSON.stringify([{ id: 'dummy-1' }]), updateResponseData);
  this.expectAjax('/solr/get', { id: 'dummy-1' }, getResponseData);

  var adapter = this.subject();
  set(adapter, 'enableRealTimeGet', true);
  adapter.serialize = function() {
    return { id: 'dummy-1' };
  };

  return Ember.run(function() {
    return adapter.updateRecord(self.store, self.dummyType, snapshot)
    .then(function(data) {
      self.verifyAjax();
      assert.deepEqual(getResponseData, data, 'response data');
    });
  });
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

  this.expectAjax('/solr/update', JSON.stringify([{ id: 'dummy-1' }]), updateResponseData)
    .withStatusCode(409);

  var adapter = this.subject();
  set(adapter, 'enableRealTimeGet', true);
  adapter.serialize = function() {
    return { id: 'dummy-1' };
  };

  return Ember.run(function() {
    return adapter.updateRecord(self.store, self.dummyType, snapshot)
    .then(function(data) {
      assert.ok(false, 'Should have rejected with DS.InvalidError');
    }).catch(function(err) {
      self.verifyAjax();
      assert.ok(err instanceof ConcurrentModificationError, 'expected to reject with instance of ConcurrentModificationError');
      assert.equal(err.message, updateResponseData.error.msg, 'error.message');
    });
  });
});
