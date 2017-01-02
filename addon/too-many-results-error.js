/**
  @module solr
*/

import Ember from 'ember';

/**
  Thrown by SolrSerializer.extractSingle when more
  than one document matches a query and exactly one
  record is expected.

  @class TooManyResultsError
*/
function TooManyResultsError(type, id, count) {
  type = typeof type === 'string' ? type : type.modelName;
  var message = `Query for single document of type '${type}' returned ${count} documents when exactly one was expected.`;

  Ember.Error.call(this, message);
  this.type = type;
  this.id = id;

  /**
    The actual number of documents that were returned.

    @property count
    @type {number}
  */
  this.count = count;
}

TooManyResultsError.prototype = Ember.Error.prototype;

export default TooManyResultsError;
