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

  extractFind: function(store, type, payload, id, requestType) {
    var result = this._super(store, type, payload, id, requestType);
    if (result.length !== 1) {
      throw new Error('Expected Solr response array with exactly one document but got `' + result.length + '`.');
    }

    return result[0];
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
  },

  normalizePayload: function(payload) {
    payload = payload.response.docs;

    if (!payload) {
      throw new Error('Expected Solr response payload to contain `response.docs`.');
    }

    return this._super(payload);
  }
});
