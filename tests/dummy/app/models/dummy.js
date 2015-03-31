import DS from 'ember-data';

export default DS.Model.extend({
  title: DS.attr('string'),
  flags: DS.attr('number')
});
