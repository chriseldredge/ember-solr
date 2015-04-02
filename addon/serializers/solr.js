/**
  @module solr
*/

import Ember from 'ember';
import DS from 'ember-data';

/**
  Ember Data Serializer for Apache Solr.

  @class SolrSerializer
  @extends DS.JSONSerializer
*/
export default DS.JSONSerializer.extend({

  /**
    Converts attributes to underscore to use conventional
    Solr field names

    @method keyForAttribute
    @param {string} attr
    @return {string} key
  */
  keyForAttribute: function(attr) {
    return Ember.String.underscore(attr);
  },

  extractSingle: function(store, type, payload, id, requestType) {
    var response = payload.response;
    var docLength = (response && response.docs) ?
                        response.docs.length
                      : undefined;

    if (!payload.doc && docLength !== 1) {
      throw new Error('Expected Solr response array with exactly one document but got `' + docLength + '`.');
    }

    payload = payload.doc || response.docs[0];

    if (!payload) {
      throw new Error('Expected Solr response payload to contain property `doc` or `response.docs`.');
    }

    return this._super(store, type, payload, id, requestType);
  },

  extractArray: function(store, type, arrayPayload, id, requestType) {
    var response = arrayPayload.response;

    if (!response || !Array.isArray(response.docs)) {
      throw new Error('Expected Solr response payload to contain property `response.docs`.');
    }

    arrayPayload = response.docs;

    return this._super(store, type, arrayPayload, id, requestType);
  },

  extractMeta: function(store, type, payload) {
    var response = payload.response;

    if (!response) {
      return;
    }

    var meta = payload.responseHeader || {};

    meta.offset = response.start;
    meta.total = response.numFound;

    store.setMetadataFor(type, meta);

  }
});
