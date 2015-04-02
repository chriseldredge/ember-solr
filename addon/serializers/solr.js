/**
  @module solr
*/

import Ember from 'ember';
import DS from 'ember-data';
import SolrUpdateMode from 'ember-solr/lib/update-mode';

const forEach = Ember.EnumerableUtils.forEach;
const get = Ember.get;

/**
  Ember Data Serializer for Apache Solr.

  @class SolrSerializer
  @extends DS.JSONSerializer
*/
export default DS.JSONSerializer.extend({
  /**
    Field name to use for Solr Optimistic Concurrency.
    See [Updating Parts of Documents](https://cwiki.apache.org/confluence/display/solr/Updating+Parts+of+Documents).

    @property versionFieldName
    @type {string}
    @default '_version_'
  */
  versionFieldName: '_version_',

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
    var versionFieldName = get(this, 'versionFieldName');
    var response = payload.response || {};
    var docs = response.docs || [];

    if (payload.doc) {
      docs.pushObject(payload.doc);
    }

    var meta = payload.responseHeader || {};

    meta.offset = response.start;
    meta.total = response.numFound;
    meta.versions = {};

    forEach(docs, function(doc) {
      meta.versions[doc.id] = doc[versionFieldName];
    });

    store.setMetadataFor(type, meta);
  },

  serialize: function(record, options) {
    options = options || {};
    var updateMode = (options || {}).updateMode || SolrUpdateMode.None;

    if (updateMode === SolrUpdateMode.Atomic) {
      throw new Error('Atomic update is not yet implemented.');
    }

    var payload = this._super.apply(this, arguments);

    if (updateMode === SolrUpdateMode.None) {
      return payload;
    }

    var versionFieldName = get(this, 'versionFieldName');
    var version;

    // see https://cwiki.apache.org/confluence/display/solr/Updating+Parts+of+Documents
    const NewDocumentVersionConstraint   = -1,
          LastWriteWinsVersionConstraint = 0;

    if (get(record, 'isNew')) {
      version = NewDocumentVersionConstraint;
    } else if (updateMode === SolrUpdateMode.LastWriteWins) {
      version = LastWriteWinsVersionConstraint;
    } else {
      version = this.getRecordVersion(record);
    }

    payload[versionFieldName] = version;

    return payload;
  },

  getRecordVersion: function(record) {
    var store = get(record, 'store');
    var meta = store.metadataFor(record.typeKey);

    if (!meta || !meta.versions) {
      throw new Error('Missing metadata for record type `' + record.typeKey + '`');
    }

    var version = meta.versions[record.id];

    if (!version) {
      throw new Error('Missing document version for record id `' + record.id + '` of type `' + record.typeKey + '`');
    }

    return version;
  }
});
