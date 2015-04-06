import config from '../config/environment';
import EmberSolr from 'ember-solr';

export default <%= baseClass %>.extend({
  baseURL: <%= baseURL %>,
  enableRealTimeGet: <%= enableRealTimeGet %>
});
