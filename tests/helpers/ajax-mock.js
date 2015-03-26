import Ember from 'ember';
import QUnit from 'qunit';

const mockjax = Ember.$.mockjax;
const assert = QUnit.assert;

export default Ember.Object.extend({
  install: function() {
    var calls = this.get('calls');
    var expectations = this.get('expectations');

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
    var expectations = this.get('expectations');

    expectations[url] = {
      data: data,
      responseText: JSON.stringify(responseData || {})
    };
  },

  verifySingleAjaxCall: function() {
    assert.equal(this.get('calls').length, 1, 'number of ajax calls');
  },

  _init: function() {
    this.set('calls', []);
    this.set('expectations', []);
  }.on('init')
});
