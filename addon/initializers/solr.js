import DS from 'ember-data';
import SolrAdapter from '../adapters/solr';
import SolrSerializer from '../serializers/solr';
import SolrDynamicSerializer from '../serializers/solr-dynamic';
import MultiValuedTransform from '../transforms/multi-valued';

export default {
  name: 'solr',
  before: 'store',
  initialize: function (container, app) {
    app.register('adapter:-solr', SolrAdapter);
    app.register('serializer:-solr', SolrSerializer);
    app.register('serializer:-solr-dynamic', SolrDynamicSerializer);

    app.register('transform:double', DS.NumberTransform);
    app.register('transform:float', DS.NumberTransform);
    app.register('transform:int', DS.NumberTransform);
    app.register('transform:long', DS.NumberTransform);

    app.register('transform:text', DS.StringTransform);

    app.register('transform:strings', MultiValuedTransform);

    app.register('transform:numbers', MultiValuedTransform.extend({ elementType: 'number'}));
    app.register('transform:doubles', MultiValuedTransform.extend({ elementType: 'number'}));
    app.register('transform:floats', MultiValuedTransform.extend({ elementType: 'number'}));
    app.register('transform:ints', MultiValuedTransform.extend({ elementType: 'number'}));
    app.register('transform:longs', MultiValuedTransform.extend({ elementType: 'number'}));

    app.register('transform:booleans', MultiValuedTransform.extend({ elementType: 'boolean'}));
    app.register('transform:dates', MultiValuedTransform.extend({ elementType: 'date'}));

    DS.SolrAdapter = SolrAdapter;
    DS.SolrSerializer = SolrSerializer;
    DS.SolrDynamicSerializer = SolrDynamicSerializer;
  }
};
