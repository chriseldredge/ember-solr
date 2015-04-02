/* jshint node: true */
'use strict';

var path = require('path');

module.exports = {
  name: 'ember-solr',

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
  },

  included: function json_bignum_included(app) {
    this._super.included(app);

    app.import(path.join(app.bowerDirectory, 'json-bignum', 'lib', 'json-bignum.js'));
  }
};
