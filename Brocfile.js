/* jshint node: true */
/* global require, module */

var EmberAddon = require('ember-cli/lib/broccoli/ember-addon');
var path = require('path');

var app = new EmberAddon();

app.import(path.join(app.bowerDirectory, 'json-bignum', 'lib', 'json-bignum.js'));
app.import(path.join(app.bowerDirectory, 'jquery-mockjax', 'jquery.mockjax.js'));

module.exports = app.toTree();
