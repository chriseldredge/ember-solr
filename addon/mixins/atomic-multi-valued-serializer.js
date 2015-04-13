/**
  @module solr
*/

import Ember from 'ember';
import AtomicSerializer from './atomic-serializer';

/**
  Mixin that extends AtomicSerializerMixin to use [Atomic Updates](https://wiki.apache.org/solr/Atomic_Updates)
  with `add` and `remove` operations for array changes.

  This implementation treats arrays as unordered and distinct.
  A multiValued field will be updated any items are added or
  removed. Only values that have been added or removed are
  sent, using the `add` or `remove` operations respectively.

  Note that the `remove` operation requires Solr 5 or later.

  @class AtomicMultiValuedSerializerMixin
  @extends AtomicSerializerMixin
*/
export default Ember.Mixin.create(AtomicSerializer, {
  /**
    Uses "set arithmetic" to detect modifications
    for arrays or delegates to base implementation for non-arrays.

    @method isAttributeModified
  */
  isAttributeModified: function(snapshot, key, attribute, value, previousValue) {
    if (!Array.isArray(value) && !Array.isArray(previousValue)) {
      return value !== previousValue;
    }

    value = Ember.A(value).uniq();
    previousValue = Ember.A(previousValue).uniq();

    if (value.length !== previousValue.length) {
      return true;
    }

    return !value.every(i => previousValue.contains(i));
  },

  /**
    Uses "set arithmetic" to calculate `add` and `remove`
    operations for arrays.

    @method serializeArrayAttribute
  */
  serializeArrayAttribute: function(snapshot, key, attribute, value, previousValue) {
    var json = {};
    value = Ember.A(value).uniq();
    previousValue = Ember.A(previousValue).uniq();

    var normalize = function(key, values, withoutValues) {
      values = values.reject(i => withoutValues.contains(i));

      if (values.length === 0) {
        return;
      }
      else if (values.length === 1) {
        values = values[0];
      }
      json[key] = values;
    };

    normalize('add', value, previousValue);
    normalize('remove', previousValue, value);

    return json;
  }
});
