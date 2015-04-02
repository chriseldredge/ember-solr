import Ember from 'ember';
import QUnit from 'qunit';

const get = Ember.get,
      set = Ember.set,
      mockjax = Ember.$.mockjax,
      assert = QUnit.assert;

export default Ember.Object.extend({
  install: function() {
    var calls = get(this, 'calls');
    var expectations = get(this, 'expectations');

    mockjax(function(settings) {
      calls.push(settings);

      var match = expectations[settings.url];
      if (!match) {
        throw new Error('Unexpected ajax call to ' + settings.url);
      }

      assert.deepEqual(settings.data, match.data, 'Unexpected ajax request data');

      return {
        logging: false,
        responseText: match.responseText
      };
    });
  },

  reset: function() {
    mockjax.clear();
  },

  expect: function(url, data, responseData) {
    var expectations = get(this, 'expectations');

    expectations[url] = {
      data: data,
      responseText: JSON.stringify(responseData || {})
    };
  },

  verifySingleAjaxCall: function() {
    assert.equal(get(this, 'calls').length, 1, 'number of ajax calls');
  },

  _init: Ember.on('init', function() {
    set(this, 'calls', []);
    set(this, 'expectations', []);
  })
});
