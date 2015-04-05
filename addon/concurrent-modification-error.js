/**
  @module solr
*/

import Ember from 'ember';

var create = Ember.create;

/**
  @class ConcurrentModificationError
*/
function ConcurrentModificationError(message) {
  var errors = {
    id: [message]
  };

  Ember.Error.call(this, errors);
  this.message = message;
}

ConcurrentModificationError.prototype = create(Ember.Error.prototype);

export default ConcurrentModificationError;
