import DS from 'ember-data';
import AtomicMultiValuedSerializerMixin from 'ember-solr/mixins/atomic-multi-valued-serializer';

export default DS.JSONSerializer.extend(AtomicMultiValuedSerializerMixin, {
});
