module.exports = {
  description: 'Generates a Solr serializer.',

  availableOptions: [
    { name: 'dynamic', type: Boolean, default: false },
    { name: 'atomic', type: Boolean, default: false },
    { name: 'multiValued', type: Boolean, default: false },
  ],

  locals: function(options) {
    var baseURL = 'config.solrBaseURL';
    var baseClass = 'EmberSolr.SolrSerializer';
    var mixins = '';

    if (options.atomic && options.multiValued) {
      mixins = 'EmberSolr.AtomicMultiValuedSerializerMixin, ' + mixins;
    } else if (options.atomic) {
      mixins = 'EmberSolr.AtomicSerializerMixin, ' + mixins;
    }

    if (options.dynamic) {
      mixins = 'EmberSolr.DynamicSerializerMixin, ' + mixins;
    }

    return {
      baseClass: baseClass,
      mixins: mixins
    };
  }
};
