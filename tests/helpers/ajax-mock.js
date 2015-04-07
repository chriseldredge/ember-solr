import Ember from 'ember';
import QUnit from 'qunit';

const get = Ember.get,
      set = Ember.set,
      map = Ember.EnumerableUtils.map,
      mockjax = Ember.$.mockjax,
      assert = QUnit.assert;

export default Ember.Object.extend({
  install: function() {
    var calls = get(this, 'calls');
    var expectations = get(this, 'expectations');

    mockjax(function(settings) {
      calls.pushObject({
        url: settings.url,
        data: settings.data});

      var match = expectations[settings.url];
      if (!match) {
        throw new Error('Unexpected ajax call to ' + settings.url);
      }

      assert.deepEqual(settings.data, match.data, 'Unexpected ajax request data');

      return match;
    });
  },

  reset: function() {
    mockjax.clear();
  },

  expect: function(url, data, responseData) {
    var expectations = get(this, 'expectations');
    var settings = {
      logging: false,
      data: data,
      responseText: responseData || {}
    };

    expectations[url] = settings;

    var continuation = {
      withStatusCode: function(statusCode) {
        settings.status = statusCode;
        return continuation;
      },
      withResponseText: function(responseText) {
        settings.responseText = responseText;
        return continuation;
      }
    };

    return continuation;
  },

  verifySingleAjaxCall: function() {
    assert.equal(get(this, 'calls').length, 1, 'number of ajax calls');
  },

  verifyAll: function() {
    var actual = map(get(this, 'calls'), function(i) {
      return { url: i.url, data: i.data };
    });

    var expectations = get(this, 'expectations');
    var expected = Ember.A();
    for (var k in expectations) {
      expected.pushObject({ url: k, data: expectations[k].data });
    }

    assert.deepEqual(actual, expected, 'expected ajax calls vs actual');
  },

  _init: Ember.on('init', function() {
    set(this, 'calls', Ember.A());
    set(this, 'expectations', {});
  })
});
