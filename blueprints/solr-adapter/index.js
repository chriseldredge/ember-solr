module.exports = {
  description: 'Generates a Solr adapter.',

  availableOptions: [
    { name: 'enableRealTimeGet', type: Boolean, default: true },
    { name: 'url', type: String }
  ],

  locals: function(options) {
    var baseURL = 'config.solrBaseURL';
    var baseClass = 'EmberSolr.SolrAdapter';

    if (options.url) {
      baseURL = "'" + options.url + "'";
    }

    return {
      baseClass: baseClass,
      baseURL: baseURL,
      enableRealTimeGet: !!options.enableRealTimeGet
    };
  }
};
