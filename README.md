# ember-solr [![Build Status](https://travis-ci.org/chriseldredge/ember-solr.svg?branch=master)](https://travis-ci.org/chriseldredge/ember-solr)

Ember Data adapter that connects to a Solr server.

# Installing ember-solr with Ember CLI

    $ ember install:addon ember-solr

This will create a new setting in `config/environment.js`. Replace
the default value with your Solr server.

## Using `SolrAdapter`

    $ ember generate solr-adapter application [--enableRealTimeGet] [--url=http://example.com/solr/]

This will make a subclass of `SolrAdapter` for you to configure
and register it as the application adapter.

See [SolrAdapter](http://chris.eldredge.io/ember-solr/latest/classes/SolrAdapter.html) for properties and methods you can override.

## Documentation

Additional documentation is available at [http://chris.eldredge.io/ember-solr/latest/](http://chris.eldredge.io/ember-solr/latest/).

## `long`, `double` and `BigNumber`

ember-solr uses a custom JSON parsing library to handle Solr
`long` and `double` fields without losing precision on values
that exceed `Number.MAX_SAFE_INTEGER` (`2^53 - 1`).

These values will be automatically detected and represented
as instances of `BigNumber` using a string to represent the
complete value.

No support is provided for performing arithmetic computations
on BigNumber, such as addition, subtraction or multiplication.

## JSON-P Limitations

By default, `SolrAdapter.dataType` is set to `'jsonp'` to work with
Solr servers that do not have CORS headers enabled. If you want to
use Optimistic Concurrency or use `long` or `double` fields in
your schema, JSON-P will not be able to handle values that exceed
JavaScript's `Number.MAX_SAFE_INTEGER` (`2^53 - 1`).

In particular, this limitation means that using Solr's built-in
`_version_` field for optimistic concurrency is not possible with
JSON-P.

## Customizing Serialization

    $ ember generate solr-serializer <name> [--dynamic] [--atomic] [--multiValued]

This will generate a serializer for a given model with some options.

Flag        | Description
----------- | -----------
dynamic     | Includes DynamicSerializerMixin
atomic      | Includes AtomicSerializerMixin
multiValued | Includes AtomicMultiValuedSerializerMixin

## Custom attribute types

This adapter registers the following types that map to Solr field types

Solr field type | `DS.attr` type
--------------- | --------------
text            | string
double          | BigNumber
float           | number
int             | number
long            | BigNumber
strings         | array of string
numbers         | array of number
doubles         | array of BigNumber
floats          | array of number
ints            | array of number
longs           | array of BigNumber
booleans        | array of boolean
dates           | array of date

The plural array types are intended for use with Solr fields
that are `multiValued="true"`.

# Configuration

`config/environment.js` sets the URL of the Solr server.

`SolrAdapter` has the following properties:

* `baseURL` usually injected from `config/environment`
* `commit` (Default: `EmberSolr.CommitType.None`) include commit command in updates
* `commitWithinMilliseconds` (Default: `undefined`) include `commitWithin` in updates
* `dataType` (Default: `jsonp`) chooses normal `json` or `jsonp` to side-step cross origin restrictions
* `defaultCore` specify a Solr Core to route requests to by default
* `defaultSerializer` (Default: `-solr`)
* `enableRealtimeGet` (Default: `false`) use Solr's RealTimeGetHandler when applicable
* `updateMode` (Default: `EmberSolr.SolrUpdateMode.None`) enables optimistic concurrency by sending appropriate `_version_` on updates
`SolrAdapter` also has these methods that can be overridden:

* `coreForType` choose another Solr Core for a given type
* `filterQueryForType` create an optional filter query to filter documents
* `handlerForType` select a Solr request handler path and type for an operation
* `uniqueKeyForType` override the canonical `id` field with something else

See [SolrAdapter](http://chris.eldredge.io/ember-solr/latest/classes/SolrAdapter.html).

## Dynamic Fields

`DynamicSerializerMixin` provides a quick way to connect to a Solr server using
[Dynamic Fields](https://cwiki.apache.org/confluence/display/solr/Dynamic+Fields).

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

Then generate a serializer for your model:

    ember g solr-serializer post --dynamic

The attributes on this model would be mapped, by default, to:

* title => title_s
* keywords => keywords_ss
* body => body_txt
* popularity: popularity_f
* isPublic: is_public_b

See [DynamicSerializerMixin](http://chris.eldredge.io/ember-solr/latest/classes/DynamicSerializerMixin.html) for more on how to customize dynamic field names.

# Contributing to ember-solr

## Installation

* `git clone` this repository
* `npm install -g ember-cli bower`
* `ember install`

## Running Tests

* `ember test`

For more information on using ember-cli, visit [http://www.ember-cli.com/](http://www.ember-cli.com/).
