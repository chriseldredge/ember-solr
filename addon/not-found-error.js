/**
  @module solr
*/

import Ember from 'ember';

var create = Ember.create;

/**
  Thrown by SolrSerializer.extractSingle when the query
  returns zero documents.

  @class NotFoundError
*/
function NotFoundError(type, id) {
  type = typeof type === 'string' ? type : type.typeKey;
  var message = 'record not found for type "' + type + '" and id "' + id + '"';

  Ember.Error.call(this, message);
  this.type = type;
  this.id = id;
}

NotFoundError.prototype = create(Ember.Error.prototype);

export default NotFoundError;
