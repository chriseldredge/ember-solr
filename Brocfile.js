/* jshint node: true */
/* global require, module */

var EmberAddon = require('ember-cli/lib/broccoli/ember-addon');

var app = new EmberAddon();

app.import('bower_components/jquery-mockjax/jquery.mockjax.js');

module.exports = app.toTree();
