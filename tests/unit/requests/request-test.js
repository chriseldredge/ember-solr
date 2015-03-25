import Ember from 'ember';
import SolrRequest from 'ember-solr/requests/request';
import { module, test } from 'qunit';

module('requests');

test('init binds method', function(assert) {
  Ember.run(function() {
    var result = SolrRequest.create({
      handler: { method: 'POST' }
    });
    assert.ok(result.get('method') === 'POST', 'Should bind property `method`');
  });
});

test('init creates data', function(assert) {
  Ember.run(function() {
    var result = SolrRequest.create();
    assert.ok(result.get('data'), 'Should create truthy property `data`');
  });
});

test('init creates options', function(assert) {
  Ember.run(function() {
    var result = SolrRequest.create();
    assert.ok(result.get('options'), 'Should create truthy property `options`');
  });
});

test('init creates new options', function(assert) {
  Ember.run(function() {
    var req1 = SolrRequest.create();
    req1.get('options')['key'] = 'value';

    var req2 = SolrRequest.create();

    var req2HasKeyFromReq1 = req2.get('options').hasOwnProperty('key');
    assert.ok(req2HasKeyFromReq1 === false, 'Should create new options for each instance');
  });
});

test('init with data binds to options', function(assert) {
  Ember.run(function() {
    var result = SolrRequest.create({ data: { key: 'value' }});
    assert.ok(result.get('data'), 'Should create truthy property `data`');
    assert.ok(result.get('options.data'), 'Should create truthy property `options`');
  });
});

test('init with data and options binds', function(assert) {
  Ember.run(function() {
    var result = SolrRequest.create({
      data: { key: 'value' },
      options: { async: true }
    });

    assert.ok(result.get('data.key'), 'Should use provided `data`');
    assert.ok(result.get('options.data.key'), 'Should initialize `options.data` from `data`');
  });
});

test('init with options binds to data', function(assert) {
  Ember.run(function() {
    var result = SolrRequest.create({
      options: {
        async: true,
        data: { key: 'value' }
      }
    });

    assert.ok(result.get('options.data').key, 'Should bind data to options.data');
    assert.ok(result.get('options.async'), 'Should preserve options');
    assert.ok(result.get('data.key'), 'Should use supplied data');

  });
});

test('init throws when providing data and options.data', function(assert) {
  Ember.run(function() {
    try {
      var result = SolrRequest.create({
        data: { key: 'other value' },
        options: {
          data: { key: 'value' }
        }
      });
      assert.ok(false, 'Should throw Error');
    } catch (error) {
      assert.ok(error.message ===
        'SolrRequest accepts `data` or `options.data` but not both.');
    }
  });
});

test('set data key bound to options', function(assert) {
  Ember.run(function() {
    var request = SolrRequest.create();
    request.set('data.key', 'value');

    assert.ok(request.get('options.data')['key'], 'data property should be bound to options.data');
  });
});
