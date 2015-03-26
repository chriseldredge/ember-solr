import Ember from 'ember';
import DS from 'ember-data';

import {
  moduleFor,
  test
} from 'ember-qunit';

import QUnit from 'qunit';

import AjaxMock from '../../helpers/ajax-mock';

moduleFor('adapter:solr', 'SolrAdapter', {
  // Specify the other units that are required for this test.
  needs: ['store:main'],
  beforeEach: function() {
    this.subject().set('dataType', 'json');
    this.store = this.container.lookup('store:main');
    this.DummyModel = { typeKey: 'dummy' };

    var ajaxMock = AjaxMock.create();
    ajaxMock.install();
    this.expectAjax = Ember.run.bind(ajaxMock, ajaxMock.expect);
    this.verifySingleAjaxCall = Ember.run.bind(ajaxMock, ajaxMock.verifySingleAjaxCall);
    this.ajaxMock = ajaxMock;
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

  return adapter.find(this.store, this.DummyModel, 101)
  .then(function(data) {
    self.verifySingleAjaxCall();
    assert.deepEqual(responseData, data, 'response data');
  });
});

test('findQuery includes filter query', function(assert) {
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

  return adapter.find(this.store, this.DummyModel, 101)
  .then(function() {
    self.verifySingleAjaxCall();
  });
});

test('find by id uses real time get handler', function(assert) {
  var self = this;
  var responseData = { id: 101, title: 'Foo' };
  this.expectAjax('/solr/get', { id: 101 }, responseData);

  var adapter = this.subject();
  adapter.set('enableRealTimeGet', true);

  return adapter.find(this.store, this.DummyModel, 101)
  .then(function(data) {
    self.verifySingleAjaxCall();
    assert.deepEqual(responseData, data, 'response data');
  });
});
