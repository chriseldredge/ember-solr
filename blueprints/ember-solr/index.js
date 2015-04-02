'use strict';

var EOL         = require('os').EOL;
var chalk       = require('chalk');
var fs          = require('fs-extra');
var Promise     = require('rsvp');
var readFile    = Promise.denodeify(fs.readFile);


module.exports = {
  normalizeEntityName: function() {
    // this prevents an error when the entityName is
    // not specified (since that doesn't actually matter
    // to us
  },

  availableOptions: [
    { name: 'url', type: String }
  ],

  afterInstall: function(options) {
    var self = this,
        solrBaseURL = options.url || 'http://YOUR-SOLR-HOST-HERE/';

    return this.addBowerPackagesToProject([ {name: 'json-bignum', target: '^0.0.1'} ])
    .then(function() {
      return self.addToConfig('solrBaseURL', '\'' + solrBaseURL + '\'');
    })
    .then(function (wasAdded) {
      if (wasAdded === false) {
        return;
      }

      var output = EOL;
      output += chalk.yellow('ember-solr') + ' has been installed. Please configure your Solr URL in ' + chalk.green('config/environment.js') + EOL;
      console.log(output);
    });
  },

  addToConfig: function (key, value) {
    var self = this;
    return this.fileContains('config/environment.js', key + ':').then(function (contains) {
      if (contains) { return false; }

      var options = { after: '    environment: environment,' + EOL };
      return self.insertIntoFile('config/environment.js', '    ' + key + ': ' + value + ',', options);
    });
  },

  fileContains: function (filePath, snippet) {
    return readFile(filePath).then(function (fileContents) {
      return fileContents.toString().indexOf(snippet) !== -1;
    });
  }
};
