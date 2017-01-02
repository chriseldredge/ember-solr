/**
  @module solr
*/

import Ember from 'ember';

/**
  Thrown by SolrSerializer.extractSingle when the query
  returns zero documents.

  @class NotFoundError
*/
function NotFoundError(type, id) {
  type = typeof type === 'string' ? type : type.modelName;
  var message = `Record not found for type '${type}' and id '${id}'.`;

  Ember.Error.call(this, message);
  this.type = type;
  this.id = id;
}

NotFoundError.prototype = Ember.Error.prototype;

export default NotFoundError;
