/* jshint node: true */
'use strict';

module.exports = {
  name: 'Solr',

  config: function(environment, appConfig) {
    if (!appConfig.solrBaseURL || appConfig.solrBaseURL.indexOf(':') === -1) {
      return;
    }

    var solrSchemeAndHost = appConfig.solrBaseURL;
    var solrHostEnd = solrSchemeAndHost.indexOf('/', solrSchemeAndHost.indexOf('://') + 3);
    if (solrHostEnd > 0) {
      solrSchemeAndHost = solrSchemeAndHost.substring(0, solrHostEnd);
    }

    var ENV = {
      contentSecurityPolicy: {
        'script-src': "'self' " + solrSchemeAndHost
      }
    }

    return ENV;
  }
};
