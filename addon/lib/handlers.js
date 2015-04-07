/**
  @module solr
*/

import Ember from 'ember';

const get = Ember.get;

/**
  An enumeration of handler types that `ember-solr`
  knows how to interact with.

  @class SolrHandlerType
  @static
*/
const SolrHandlerType = {
  /**
    Represents a requst to `select`, `search` and
    other standard request handlers.

    This is the handler type that will be used in
    `findQuery`, and when real-time get is not enabled
    it will also be used in all `find*` operations.

    See [SearchHandler](http://wiki.apache.org/solr/SearchHandler).

    @property Search
    @final
    @type {string}
  */
  Search: 'SolrHandlerType.Search',

  /**
    Represents a requst to `get` and
    other real time get handlers.

    This is the handler type that will be used when
    {{#crossLink "SolrAdapter/enableRealTimeGet:property"}}{{/crossLink}}
    is set to `true` for `find`, and `findMany`.

    See [RealTimeGet](http://wiki.apache.org/solr/RealTimeGet).

    @property RealTimeGet
    @final
    @type {string}
  */
  RealTimeGet: 'SolrHandlerType.RealTimeGet',

  /**
    Represents a requst to [UpdateRequestProcessor](http://wiki.apache.org/solr/UpdateRequestProcessor)

    @property RealTimeGet
    @final
    @type {string}
  */
  Update: 'SolrHandlerType.Update'
};

/**
  An abstract representation of a Solr request
  handler, including its type, path and HTTP method.
  @class SolrRequestHandler
*/
const SolrRequestHandler = Ember.Object.extend({
  /**
    The type of request.

    @property type
    @type {SolrHandlerType}
  */
  type: null,

  /**
    The path to route the request to. Typical
    examples include handler paths like `/search`,
    `/select`, `/get`, and `/update`.

    @property path
    @type {string}
  */
  path: null,

  /**
    The HTTP method (verb) to use in the request.

    @property method
    @type {string}
    @default 'GET'
  **/
  method: 'GET',

  /**
    Builds the data to send to Solr as a querystring
    or in an HTTP POST request body.

    @method buildPayload
    @param {SolrAdapter} adapter the adapter invoking this method
    @param {subclass of DS.Model} type the type corresponding to the operation
    @param {string} operation the operation e.g. 'find', 'updateRecord', etc.
    @param {object} data the ID(s), query or snapshot payload to prepare.
    @return {object} data object
  */
  buildPayload: function(/*adapter, type, operation, data*/) {
    throw new Error('The method `buildPayload` must be overridden by a subclass.');
  }
});

/**
  Represents a default configuration of a request
  to a Solr search handler.

  @class SolrSearchHandler
  @extends SolrRequestHandler
*/
const SolrSearchHandler = SolrRequestHandler.extend({
  /**
    @property type
    @default `SolrHandlerType.Search`
  */
  type: SolrHandlerType.Search,

  /**
    @property path
    @default 'select'
  */
  path: 'select',

  buildPayload: function(adapter, type, operation, data) {
    data = data || {};
    var key = adapter.uniqueKeyForType(type);

    if (Array.isArray(data)) {
      var query = data.map(function(id) {
        return key + ':' + id;
      }).join(' OR ');

      data = {
        q: query
      };
    } else if (typeof data !== 'object') {
      data = {
        q: key + ':' + data
      };
    }

    return this.buildSolrQuery(adapter, type, operation, data);
  },

  /**
    Builds a Solr query to send in a search request.
    This method applies some defaults and converts
    idiomatic Ember query parameters to their
    Solr corollaries.

    * Sets `wt=json`
    * Converts `limit` to `rows`
    * Converts `offset` to `start`
    * Defaults to `q=*:*` when no query is specified
    * Calls {{#crossLink "SolrAdapter/filterQueryForType:method"}}{{/crossLink}}
    and sets `fq` when a non-blank filter query is returned

    Overrides of this method can return an object that includes
    other query options. Multipe `fq` parameters (and others)
    can be defined by using an array for the values:
    ```javascript
    App.ApplicationAdapter = SolrAdapter.extend({
      buildSolrQuery: function(type, query) {
        return {
          fq: [
            'type:' + type,
            'public:true'
          ]
        };
      }
    });
    ```

    See [QueryResponseWriter](https://wiki.apache.org/solr/QueryResponseWriter)
    and [CommonQueryParameters](https://wiki.apache.org/solr/CommonQueryParameters).

    @method buildSolrQuery
    @param {SolrAdapter} adapter the adapter invoking this method
    @param {String} type
    @param {String} operation
    @param {Object} query
    @return {Object} data hash for ajax request
    @protected
  */
  buildSolrQuery: function(adapter, type, operation, query) {
    var solrQuery = {
      wt: 'json'
    };

    if (query.limit) {
      solrQuery.rows = query.limit;
    }

    if (query.offset) {
      solrQuery.start = query.offset;
    }

    var typeFilter = !!adapter.filterQueryForType ? adapter.filterQueryForType(type, operation) : null;
    if (typeFilter) {
      solrQuery.fq = typeFilter;
    }

    solrQuery.q = query.q || '*:*';

    return solrQuery;
  },
});

/**
  Represents a default configuration of a request
  to a Solr Real Time Get handler.

  @class SolrRealTimeGetHandler
*/
const SolrRealTimeGetHandler = SolrRequestHandler.extend({
  /**
    @property type
    @default `SolrHandlerType.RealTimeGet`
  */
  type: SolrHandlerType.RealTimeGet,

  /**
    @property path
    @default 'get'
  */
  path: 'get',

  buildPayload: function(adapter, type, operation, data) {
    var key = adapter.uniqueKeyForType(type);
    var payload = {};
    payload[key] = data;
    return payload;
  }
});

/**
  Represents a default configuration of a request
  to a Solr Update Request Processor.

  @class SolrRealTimeGetHandler
*/
const SolrUpdateHandler = SolrRequestHandler.extend({
  /**
    @property type
    @default `SolrHandlerType.RealTimeGet`
  */
  type: SolrHandlerType.Update,

  /**
    @property path
    @default 'get'
  */
  path: 'update',

  /**
    @property method
    @default 'POST'
  */
  method: 'POST',

  buildPayload: function(adapter, type, operation, data) {
    data = {
      add: {
        doc: data
      }
    };

    var commitWithin = get(adapter, 'commitWithinMilliseconds');

    if (get(adapter, 'commit') === true) {
      data.commit = {};
    } else if (commitWithin > 0) {
      data.add.commitWithin = commitWithin;
    }

    return data;
  }
});

export {
  SolrHandlerType,
  SolrRequestHandler,
  SolrSearchHandler,
  SolrRealTimeGetHandler,
  SolrUpdateHandler
};
