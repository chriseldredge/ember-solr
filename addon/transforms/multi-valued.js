import Ember from 'ember';
import DS from 'ember-data';

export default DS.Transform.extend({
  elementType: 'string',

  elementTransform: Ember.computed('elementType', function() {
    var elementType = this.get('elementType');
    var key = 'transform:' + elementType;
    var result = this.container.lookup(key);
    if (!result && elementType !== 'string') {
      throw new Error("Unable to find transform for '" + elementType + "'");
    }
    return result;
  }),

  deserialize: function(serialized) {
    return this.convert(serialized, 'deserialize');
  },

  serialize: function(deserialized) {
    return this.convert(deserialized, 'serialize');
  },

  convert: function(array, funcName) {
    if (!Array.isArray(array)) {
      return array;
    }

    var elementType = this.get('elementType');
    var func = null;

    return array.map(function(i) {
      if (typeof i === elementType) {
        return i;
      }

      if (!func) {
        func = this.get('elementTransform')[funcName];
      }

      return func(i);
    }, this);
  }
});
