/**
  @module solr
*/

import Ember from 'ember';
import NotDirtyError from 'ember-solr/not-dirty-error';

const get = Ember.get;

/**
  Mixin that serializes uses [Atomic Updates](https://wiki.apache.org/solr/Atomic_Updates)
  to only update fields that have been modified.

  Atomic Updates can optionally include Optimistic Concurrency
  to ensure updates are not conflicting with other clients.
  See {{#crossLink "SolrAdapter/updateMode:property"}}SolrAdapter.updateMode{{/crossLink}}.

  This implementation treats arrays as ordered and non-distinct.
  A multiValued field will be updated if the order of items
  changes or if any items are added or removed. The entire
  array will be sent using a `set` operation to preserve order
  and allow for duplicate values.

  To treat multiValued fields as distinct sets, use
  {{#crossLink "AtomicMultiValuedSerializerMixin"}}{{/crossLink}}
  which will use `add` and `remove` operations.

  @class AtomicSerializerMixin
  @extends SolrSerializer
*/
export default Ember.Mixin.create({

  /**
    Serialize only modified attributes for a snapshot
    using atomic update operations.

    @method serialize
    @param {DS.Snapshot} snapshot
    @param {object} options
  */
  serialize: function(snapshot, options) {
    // don't pass options with includeId = true; handled later.
    var json = this._super(snapshot);

    if (Ember.isEmpty(Object.keys(json))) {
      throw new NotDirtyError(snapshot.type, snapshot.id);
    }

    var id = snapshot.id;
    if (id) {
      var primaryKey = get(this, 'primaryKey') || 'id';
      json[primaryKey] = id;
    }

    if (typeof this.setVersionConstraint === 'function') {
      this.setVersionConstraint(snapshot, options, json);
    }

    return json;
  },

  /**
    Determines if an attribute can be serialized and if the
    value is dirty.

    @method serializeAttribute
    @param {DS.Snapshot} snapshot
    @param {object} json
    @param {string} key
    @param {DS.Attribute} attribute
  */
  serializeAttribute: function(snapshot, json, key, attribute) {
    if (typeof this._canSerialize === 'function' && !this._canSerialize(key)) {
      return;
    }

    var value = snapshot.attr(key);
    var previousValue = get(snapshot.record, 'data')[key];

    var type = attribute.type;
    if (type) {
      var transform = this.transformFor(type);
      value = transform.serialize(value);
      previousValue = transform.serialize(previousValue);
    }

    if (!this.isAttributeModified(snapshot, key, attribute, value, previousValue)) {
      return;
    }

    var payloadKey = key;

    // this is bad and you should feel bad:
    if (typeof this._getMappedKey === 'function') {
      payloadKey = this._getMappedKey(key);
    }

    if (payloadKey === key && typeof this.keyForAttribute === 'function') {
      payloadKey = this.keyForAttribute(key);
    }

    if (Array.isArray(value) || Array.isArray(previousValue)) {
      var diff = this.serializeArrayAttribute(snapshot, key, attribute, value, previousValue);
      if (!Ember.isEmpty(Object.keys(diff))) {
        json[payloadKey] = diff;
      }
    } else {
      json[payloadKey] = {set: value};
    }
  },

  /**
    Determine if a value is modified from a previous value.

    @method isAttributeModified
    @param {DS.Snapshot} snapshot
    @param {string} key
    @param {DS.Attribute} attribtue
    @param {anything} value
    @param {anything} previousValue
    @return {boolean}
  */
  isAttributeModified: function(snapshot, key, attribute, value, previousValue) {
    if (!Array.isArray(value) && !Array.isArray(previousValue)) {
      return value !== previousValue;
    }

    value = value || [];
    previousValue = previousValue || [];

    if (value.length !== previousValue.length) {
      return true;
    }

    for (var i=0; i<value.length; i++) {
      if (value[i] !== previousValue[i]) {
        return true;
      }
    }

    return false;
  },

  /**
    Serialize an update to a multiValued field.

    @method serializeArrayAttribute
    @param {DS.Snapshot} snapshot
    @param {string} key
    @param {DS.Attribute} attribute
    @param {anything} value
    @param {anything} previousValue
    @return {object}
  */
  serializeArrayAttribute: function(snapshot, key, attribute, value /*, previousValue */) {
    return {set: value};
  }
});
