import Ember from 'ember';
import DS from 'ember-data';
import SolrAdapter from '../adapters/solr';
import SolrSerializer from '../serializers/solr';

export default {
  name: 'solr',
  before: 'store',
  initialize: function (container, app) {
    app.register('adapter:-solr', SolrAdapter);
    app.register('serializer:-solr', SolrSerializer);

    DS.SolrAdapter = SolrAdapter;
    DS.SolrSerializer = SolrSerializer;
  }
};
