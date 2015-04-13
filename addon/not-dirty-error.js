/**
  @module solr
*/

import Ember from 'ember';

var create = Ember.create;

/**
  Thrown by {{#crossLink "AtomicSerializerMixin/serialize:method"}}AtomicSerializerMixin.serialize{{/crossLink}}
  when the snapshot
  is not different from the loaded record.

  @class NotDirtyError
*/
function NotDirtyError(type, id) {
  type = typeof type === 'string' ? type : type.typeKey;
  var message = 'Cannot use atomic update because record of type `' +
    type + '` with id `' + id + '` has no pending changes.';

  Ember.Error.call(this, message);
  this.type = type;
  this.id = id;
}

NotDirtyError.prototype = create(Ember.Error.prototype);

export default NotDirtyError;
