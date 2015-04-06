module.exports = {
  description: 'Generates a Solr serializer.',

  availableOptions: [
    { name: 'dynamic', type: Boolean, default: false },
  ],

  locals: function(options) {
    var baseURL = 'config.solrBaseURL';
    var baseClass = 'EmberSolr.SolrSerializer';

    if (options.dynamic) {
      baseClass = 'EmberSolr.SolrDynamicSerializer';
    }

    return {
      baseClass: baseClass
    };
  }
};
