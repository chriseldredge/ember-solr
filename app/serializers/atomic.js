import DS from 'ember-data';
import AtomicSerializerMixin from 'ember-solr/mixins/atomic-serializer';

export default DS.JSONSerializer.extend(AtomicSerializerMixin, {
});
