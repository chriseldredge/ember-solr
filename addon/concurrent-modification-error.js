/**
  @module solr
*/

import Ember from 'ember';

var create = Ember.create;

/**
  Thrown when an update is rejected by Solr because
  the `_version_` contraint was not met by the server.

  This error can be thrown when attempting to create
  a record with an ID that is already in use, or when
  attempting to update a document with a version that
  is not the newest version.

  @class ConcurrentModificationError
*/
function ConcurrentModificationError(message) {
  var errors = {
    id: [message]
  };

  Ember.Error.call(this, errors);

  /**
    Message from the server indicating why the
    update was rejected.

    @property message
    @type {string}
  */
  this.message = message;
}

ConcurrentModificationError.prototype = create(Ember.Error.prototype);

export default ConcurrentModificationError;
