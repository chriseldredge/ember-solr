import config from '../config/environment';
import SolrAdapter from 'ember-solr/adapters/solr';

export default <%= baseClass %>.extend({
  baseURL: <%= baseURL %>,
  enableRealTimeGet: <%= enableRealTimeGet %>
});
