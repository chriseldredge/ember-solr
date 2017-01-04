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
    Determines the [unique key](https://wiki.apache.org/solr/UniqueKey)
    for a given type. Default Solr schemas use the canonical field `id`
    and this method defaults to the same field, which is also the default
    used by Ember Data.

    @property primaryKey
    @type {String}
    @default 'id'
  */
  primaryKey: 'id',

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

  normalizeResponse(store, primaryModelClass, payload) {
    var documentHash = this._super(...arguments);
    documentHash.meta = this.normalizeMeta(store, primaryModelClass, payload);
    return documentHash;
  },

  normalizeSingleResponse: function(store, primaryModelClass, payload, id, requestType) {
    var response = payload.response;
    var docLength = (response && Array.isArray(response.docs)) ?
                        response.docs.length
                      : NaN;

    if (payload.hasOwnProperty('doc') && payload.doc === null) {
      throw new NotFoundError(primaryModelClass, id);
    } else if (docLength === 0) {
      throw new NotFoundError(primaryModelClass, id);
    } else if (docLength > 1) {
      throw new TooManyResultsError(primaryModelClass, id, docLength);
    }

    payload = payload.doc || response.docs[0];

    return this._super(store, primaryModelClass, payload, id, requestType);
  },

  normalizeArrayResponse: function(store, primaryModelClass, payload, id, requestType) {
    var response = payload.response;
    if (!response || !Array.isArray(response.docs)) {
      throw new Error('Expected Solr response payload to contain property `response.docs`.');
    }

    payload = response.docs;
    return this._super(store, primaryModelClass, payload, id, requestType);
  },

  normalizeSaveResponse: function(/*store, primaryModelClass, payload, id, requestType*/) {
    return {};
  },

  /**
    Returns Solr metadata from `responseHeader`, if present, and adds
    offset/total metadata from `response.start` and `response.numFound`.
  */
  normalizeMeta: function(store, type, payload) {
    var response = payload.response || {};
    var meta = payload.responseHeader || {};
    if ('start' in response) {
      meta.offset = response.start;
    }
    if ('numFound' in response) {
      meta.total = response.numFound;
    }
    return meta;
  },

  normalize(modelClass, resourceHash) {
    var versionFieldName = get(this, 'versionFieldName');
    var dataHash = this._super(...arguments);
    var meta = {};

    if (versionFieldName in resourceHash) {
      meta.version = resourceHash[versionFieldName];
    }
    if ('score' in resourceHash) {
      meta.score = resourceHash['score'];
    }

    dataHash.data.meta = meta;

    return dataHash;
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
    var version = snapshot.record.meta.version;

    if (!version) {
      throw new Error(`Missing document version for record id ${snapshot.id} of type "${snapshot.modelName}".`);
    }

    return version;
  }
});
