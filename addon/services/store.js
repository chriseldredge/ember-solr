import Ember from 'ember';
import DS from 'ember-data';

var assign = Ember.assign || Ember.merge;
var set = Ember.set;

export default DS.Store.extend({
  buildInternalModel() {
    var internalModel = this._super(...arguments);
    internalModel._meta = {};

    var origSetupData = internalModel.setupData;
    internalModel.setupData = function(data) {
      if (data.meta) {
        set(this, '_meta', data.meta);
      }
      return origSetupData.apply(this, arguments);
    };

    var origMaterializeRecord = internalModel.materializeRecord;
    internalModel.materializeRecord = function() {
      origMaterializeRecord.apply(this, arguments);
      Object.defineProperty(this.record, 'meta', {
        get: function() {
          return this._internalModel._meta;
        }
      });
    }

    return internalModel;
  }
});
