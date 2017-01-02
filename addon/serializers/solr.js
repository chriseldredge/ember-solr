/**
  @module solr
*/

import Ember from 'ember';
import DS from 'ember-data';
import NotFoundError from 'ember-solr/not-found-error';
import TooManyResultsError from 'ember-solr/too-many-results-error';
import SolrUpdateMode from 'ember-solr/lib/update-mode';

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
    var docLength = (response && Array.isArray(response.docs)) ?
                        response.docs.length
                      : NaN;

    if (payload.hasOwnProperty('doc') && payload.doc === null) {
      throw new NotFoundError(type, id);
    } else if (docLength === 0) {
      throw new NotFoundError(type, id);
    } else if (docLength > 1) {
      throw new TooManyResultsError(type, id, docLength);
    }

    payload = payload.doc || response.docs[0];

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

  extractDeleteRecord: function() {
  },

  extractMeta: function(store, type, payload) {
    var versionFieldName = get(this, 'versionFieldName');
    var response = payload.response || {};
    var docs = Ember.A(response.docs || []);

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

  serialize: function(snapshot, options) {
    options = options || {};
    var json = this._super.apply(this, arguments);

    for (var k in json) {
      var attrValue = json[k];
      if (Ember.isEmpty(attrValue)) {
        delete json[k];
      }
    }

    this.setVersionConstraint(snapshot, options, json);

    return json;
  },

  setVersionConstraint: function(snapshot, options, doc) {
    var updateMode = (options || {}).updateMode || SolrUpdateMode.None;
    if (updateMode === SolrUpdateMode.None) {
      return doc;
    }

    var versionFieldName = get(this, 'versionFieldName');
    var version;

    // see https://cwiki.apache.org/confluence/display/solr/Updating+Parts+of+Documents
    const NewDocumentVersionConstraint   = -1,
          LastWriteWinsVersionConstraint = 0;

    if (get(snapshot.record, 'isNew')) {
      version = NewDocumentVersionConstraint;
    } else if (updateMode === SolrUpdateMode.LastWriteWins) {
      version = LastWriteWinsVersionConstraint;
    } else {
      version = this.getRecordVersion(snapshot);
    }

    doc[versionFieldName] = version;
    return doc;
  },

  getRecordVersion: function(snapshot) {
    var store = snapshot.record.store;
    var meta = store.metadataFor(snapshot.typeKey);

    if (!meta || !meta.versions) {
      throw new Error('Missing metadata for record type `' + snapshot.typeKey + '`');
    }

    var version = meta.versions[snapshot.id];

    if (!version) {
      throw new Error('Missing document version for record id `' + snapshot.id + '` of type `' + snapshot.typeKey + '`');
    }

    return version;
  }
});
