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

`SorlDynamicSerializer` provides a quick way to connect to a Solr server using
[Dynamic Fields](https://cwiki.apache.org/confluence/display/solr/Dynamic+Fields).

To connect to the Solr Schemaless example, use these example in your `app/adapters/application.js`:

```javascript
import config from '../config/environment';
import SolrAdapter from 'ember-solr/adapters/solr';

export default SolrAdapter.extend({
  baseURL: config.solrBaseURL,
  defaultCore: 'gettingstarted',
  defaultSerializer: '-solr-dynamic',
  enableRealTimeGet: true
});
```

Declare a model such as:

```javascript
import DS from 'ember-data';

export default DS.Model.extend({
  title: DS.attr(),
  keywords: DS.attr('strings'),
  body: DS.attr('text'),
  popularity: DS.attr('float'),
  isPublic: DS.attr('boolean')
});
```

The attributes on this model would be mapped, by default, to:

* title => title_s
* keywords => keywords_ss
* body => body_txt
* popularity: popularity_f
* isPublic: is_public_b

# Contributing to ember-solr

## Installation

* `git clone` this repository
* `npm install -g ember-cli bower`
* `ember install`

## Running Tests

* `ember test`

For more information on using ember-cli, visit [http://www.ember-cli.com/](http://www.ember-cli.com/).
