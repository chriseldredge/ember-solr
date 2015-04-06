/**
  @module solr
*/

import Ember from 'ember';

var create = Ember.create;

/**
  Thrown by SolrSerializer.extractSingle when more
  than one document matches a query and exactly one
  record is expected.

  @class TooManyResultsError
*/
function TooManyResultsError(type, id, count) {
  type = typeof type === 'string' ? type : type.typeKey;
  var message = 'Query for single document of type "' +
                type + '" returned more than 1 document: ' + count;

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

TooManyResultsError.prototype = create(Ember.Error.prototype);

export default TooManyResultsError;
