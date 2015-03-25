# ember-solr

Ember Data adapter that connects to a Solr server.

The `SolrAdapter` currently provides the read methods on `DS.Adapter`
like `find` and `findQuery`.

# Installing ember-solr with Ember CLI

    $ ember install:addon ember-solr

This will create a new setting in `config/environment.js`. Replace
the default value with your Solr server.

## Using `SolrAdapter`

    $ ember generate solr-adapter application

This will make a subclass of `SolrAdapter` for you to configure
and register it as the application adapter.

# Configuration

`config/environment.js` sets the URL of the Solr server.

`SolrAdapter` has the following properties:

* `baseURL` usually injected from `config/environment`
* `dataType` (Default: `jsonp`) chooses normal `json` or `jsonp` to side-step cross origin restrictions
* `defaultCore` specify a Solr Core to route requests to by default
* `defaultSerializer` (Default: `-solr`)
* `enableRealtimeGet` (Default: `false`) use Solr's RealTimeGetHandler when applicable

`SolrAdapter` also has these methods that can be overridden:

* `coreForType` choose another Solr Core for a given type
* `filterQueryForType` create an optional filter query to filter documents
* `handlerForType` select a Solr request handler path and type for an operation
* `uniqueKeyForType` override the canonical `id` field with something else

# Contributing to ember-solr

## Installation

* `git clone` this repository
* `npm install -g ember-cli bower`
* `ember install`

## Running Tests

* `ember test`

For more information on using ember-cli, visit [http://www.ember-cli.com/](http://www.ember-cli.com/).
