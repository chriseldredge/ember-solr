/**
  @module solr
*/

import Ember from 'ember';
import DS from 'ember-data';
import {
  SolrHandlerType,
  SolrSearchHandler,
  SolrRealTimeGetHandler,
  SolrUpdateHandler
} from 'ember-solr/lib/handlers';

import SolrRequest from 'ember-solr/lib/request';
import SolrUpdateMode from 'ember-solr/lib/update-mode';
import bigNumberStringify from 'ember-solr/lib/big-number-stringify';
import ConcurrentModificationError from 'ember-solr/concurrent-modification-error';

const forEach = Ember.ArrayPolyfills.forEach,
      get = Ember.get,
      set = Ember.set;

/**
  Ember Data Adapter for Apache Solr.
  @class SolrAdapter
  @extends DS.Adapter
*/
export default DS.Adapter.extend({
  /**
    The base URL where the Solr instance is hosted.
    This property is typically configured by setting
    `ENV.solrBaseURL` in your `config/environment.js`
    file.
    @property baseURL
    @type {string}
    @default '/solr'
  */
  baseURL: '/solr',

  /**
    Specifies a default Solr Core to send requests
    to. If no default core is configured, this adapter
    will not include a core in the request URI path
    and the Solr server will use its own default.
    @property defaultCore
    @type {string}
    @default null
  */
  defaultCore: null,

  /**
    Sets the default serializer for this adapter.
    Uses {{#crossLink "SolrSerializer"}}{{/crossLink}} by default.
    @property defaultSerializer
    @type {string}
    @default '-solr'
  */
  defaultSerializer: '-solr',

  /**
    Sets the data type for jQuery ajax requests.
    Either `json` or `jsonp` are supported.
    `jsonp` is provided as the default to allow cross-origin
    requests to succeed without needing special customization
    of the Solr server.
    @property dataType
    @type {string}
    @default 'jsonp'
  */
  dataType: 'jsonp',

  /**
    Enables or disables sending requests to Solr's
    Real Time Get handler. Note that this handler is
    disabled by default on many Solr servers.

    Real Time Get allows retrieval of documents that
    have not yet been committed by retrieving them from
    the update log.

    If you are using SolrCloud, it is generally safe to
    enable this feature.

    @property enableRealTimeGet
    @type {boolean}
    @default false
  */
  enableRealTimeGet: false,

  /**
    Sets the mode for how updates are sent
    to Solr.

    @property updateMode
    @type {SolrUpdateType}
    @default SolrUpdateType.OptimisticConcurrency
  */
  updateMode: SolrUpdateMode.OptimisticConcurrency,

  /**
    Find a record by its unique ID.

    @method find
  */
  find: function(store, type, id) {
    var request = this.buildRequest(type.typeKey, 'find', id);

    return this.executeRequest(request);
  },

  /**
    Find all documents of a type.

    @method findAll
  */
  findAll: function(store, type, sinceToken) {
    console.log('findAll since', sinceToken);
    var request = this.buildRequest(type.typeKey, 'findAll');

    return this.executeRequest(request);
  },

  /**
    Find multiple documents in a single request.

    @method findMany
  */
  findMany: function(store, type, ids) {
    var request = this.buildRequest(type.typeKey, 'findMany', ids);

    return this.executeRequest(request);
  },

  /**
    Find one or more records by arbitrary query

    The query hash should include the key `q` with
    an appropriate Solr query to execute. If this key
    is not specified, `*:*` will be used to match all
    documents.

    The query hash may include the keys `limit` and/or
    `offset` to override the Solr request handler's
    page size and retrieve rows from a given offset.

    @method findQuery
  */
  findQuery: function(store, type, query) {
    var request = this.buildRequest(type.typeKey, 'findQuery', query);

    return this.executeRequest(request);
  },

  createRecord: function() {
    throw new Error('not implemented');
  },

  updateRecord: function(store, type, snapshot) {
    var options = {
      includeId: true,
      updateMode: get(this, 'updateMode')
    };

    var data = this.serialize(snapshot, options);

    var request = this.buildRequest(type.typeKey, 'updateRecord', [data]);

    var self = this;

    return this.executeRequest(request)
    .then(function() {
      return self.find(store, type, snapshot.id);
    });
  },

  deleteRecord: function() {
    throw new Error('not implemented');
  },

  serialize: function(snapshot, options) {
    var store = snapshot.record.store;
    var serializer = store.serializerFor(snapshot.typeKey);
    return serializer.serialize(snapshot, options);
  },

  /**
    Builds a request to send to Solr.

    @method buildRequest
    @param {string} type the model type
    @param {string} operation one of `find`, `findQuery`, etc.
    @param {data} data to be sent in the request
    @return {SolrRequest} request
    @protected
  */
  buildRequest: function(type, operation, data) {
    var handler = this.handlerForType(type, operation);
    var key = this.uniqueKeyForType(type);

    if (get(handler, 'type') === SolrHandlerType.RealTimeGet) {
      query = {};
      query[key] = data;
      data = query;
    } else if (get(handler, 'type') === SolrHandlerType.Search) {
      data = data || {};

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

      data = this.buildSolrQuery(type, operation, data);
    }

    return SolrRequest.create({
      core: this.coreForType(type, operation),
      handler: handler,
      data: data
    });
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
    @param {String} type
    @param {String} operation
    @param {Object} query
    @return {Object} data hash for ajax request
    @protected
  */
  buildSolrQuery: function(type, operation, query) {
    var solrQuery = {
      wt: 'json'
    };

    if (query.limit) {
      solrQuery.rows = query.limit;
    }

    if (query.offset) {
      solrQuery.start = query.offset;
    }

    var typeFilter = !!this.filterQueryForType ? this.filterQueryForType(type, operation) : null;
    if (typeFilter) {
      solrQuery.fq = typeFilter;
    }

    solrQuery.q = query.q || '*:*';

    return solrQuery;
  },

  /**
    Determines which Solr Core should handle queries for
    a given type and oepration. By default,
    {{#crossLink "SolrAdapter/defaultCore:property"}}{{/crossLink}}
    is used.
    @method coreForType
    @param {String} type
    @param {String} operation
    @return {String} core name
    @protected
  */
  coreForType: function() {
    return get(this, 'defaultCore');
  },

  /**
    Determines the [unique key](https://wiki.apache.org/solr/UniqueKey)
    for a given type. Default Solr schemas use the canonical field `id`
    and this method defaults to the same field.
    @method uniqueKeyForType
    @param {String} type
    @return {String}
    @protected
  */
  uniqueKeyForType: function() {
    return 'id';
  },

  /**
    Determines which Solr Core should handle queries for
    a given type and operation.

    When
    {{#crossLink "SolrAdapter/enableRealTimeGet:property"}}{{/crossLink}}
    is set to `true`, this method will choose RealTimeGet
    for `find` and `findMany` operations.

    Override this method to customize the path and type
    of handler that should be used for given operations.

    @method handlerForType
    @param {String} type
    @param {String} operation
    @return {SolrRequestHandler} handler instance
    @protected
  */
  handlerForType: function(type, operation) {
    var enableRealTimeGet = get(this, 'enableRealTimeGet');

    if (enableRealTimeGet &&
        (operation === 'find' || operation === 'findMany')) {
      return SolrRealTimeGetHandler.create();
    }

    if (operation === 'updateRecord') {
      return SolrUpdateHandler.create();
    }

    return SolrSearchHandler.create();
  },

  /**
    Builds an optional filter query (`fq`) to include in search requests.
    If multiple models are stored in the same Solr Core, applying
    an appropriate filter query will ensure only the documents of
    the appropriate type are included.
    Example
    ```javascript
    App.ApplicationAdapter = SolrAdapter.extend({
      filterQueryForType: function(type) {
        return 'doc_type:' + type;
      }
    });
    ```
    See [CommonQueryParameters](https://wiki.apache.org/solr/CommonQueryParameters#fq).
    @method filterQueryForType
    @param {String} type
    @param {String} operation
    @return {String} a filter query or `null`
    @protected
  */

  /**
    Builds a complete URL and initiates
    an AJAX request to Solr.

    @method executeRequest
    @param {SolrRequest} request
    @return {Promise} promise
    @protected
  */
  executeRequest: function(request) {
    var URL = this.combinePath(
      get(this, 'baseURL'),
      get(request, 'core'),
      get(request, 'handler.path'));

    return this.ajax(URL, get(request, 'method'), get(request, 'options'));
  },

  /**
    Joins two or more strings into a path delimited
    by forward slashes without adding redundant slashes.
    Any number of arguments can be passed into this method.
    @method combinePath
    @param {string} path1
    @param {string} path2
    @return {string}
    @protected
  */
  combinePath: function(path1) {
    var s = path1;

    for (var i = 1; i < arguments.length; i++) {
      var part = arguments[i];
      if (!part) {
        continue;
      }

      if (s[s.length - 1] !== '/' && part[0] !== '/') {
        s += '/';
      } else if (s[s.length - 1] === '/' && part[0] === '/') {
        part = part.substring(1);
      }

      s += part;
    }

    return s;
  },

  /**
    Takes a URL, an HTTP method and a hash of data, and makes an
    HTTP request.
    When the server responds with a payload, Ember Data will call into `extractSingle`
    or `extractArray` (depending on whether the original query was for one record or
    many records).
    By default, `ajax` method has the following behavior:
    * It sets the response `dataType` to `"json"`
    * If the HTTP method is not `"GET"`, it sets the `Content-Type` to be
      `application/json; charset=utf-8`
    * If the HTTP method is not `"GET"`, it stringifies the data passed in. The
      data is the serialized record in the case of a save.
    * Registers success and failure handlers.
    @method ajax
    @private
    @param {String} url
    @param {String} type The request type GET, POST, PUT, DELETE etc.
    @param {Object} options
    @return {Promise} promise
    @protected
  */
  ajax: function(url, type, options) {
    var adapter = this;

    return new Ember.RSVP.Promise(function(resolve, reject) {
      var hash = adapter.ajaxOptions(url, type, options);

      hash.converters = {
        'text json': function(text) {
          return BigNumberJSON.parse(text);
        }
      };

      hash.success = function(json, textStatus, jqXHR) {
        json = adapter.ajaxSuccess(jqXHR, json);
        if (json instanceof DS.InvalidError) {
          Ember.run(null, reject, json);
        } else {
          Ember.run(null, resolve, json);
        }
      };

      hash.error = function(jqXHR, textStatus, errorThrown) {
        Ember.run(null, reject, adapter.ajaxError(jqXHR, jqXHR.responseText, errorThrown));
      };

      Ember.$.ajax(hash);
    }, 'Solr: SolrAdapter#ajax ' + type + ' to ' + url);
  },

  /**
    @method ajaxOptions
    @private
    @param {String} url
    @param {String} type The request type GET, POST, PUT, DELETE etc.
    @param {Object} options
    @return {Object}
    @protected
  */
  ajaxOptions: function(url, type, options) {
    var hash = options || {};
    hash.url = url;
    hash.type = type;
    hash.dataType = get(this, 'dataType') || 'json';
    hash.context = this;
    hash.traditional = true;

    if (hash.dataType.indexOf('jsonp') === 0) {
      hash.jsonp = 'json.wrf';
    }

    if (hash.data && type !== 'GET') {
      hash.contentType = 'application/json; charset=utf-8';
      set(hash, 'data', bigNumberStringify(hash.data));
    }

    var headers = get(this, 'headers');
    if (headers !== undefined) {
      hash.beforeSend = function (xhr) {
        forEach.call(Ember.keys(headers), function(key) {
          xhr.setRequestHeader(key, headers[key]);
        });
      };
    }

    return hash;
  },

  /**
    Takes an ajax response, and returns the json payload.
    By default this hook just returns the jsonPayload passed to it.
    You might want to override it in two cases:
    1. Your API might return useful results in the request headers.
    If you need to access these, you can override this hook to copy them
    from jqXHR to the payload object so they can be processed in you serializer.
    2. Your API might return errors as successful responses with status code
    200 and an Errors text or object. You can return a DS.InvalidError from
    this hook and it will automatically reject the promise and put your record
    into the invalid state.
    @method ajaxSuccess
    @param  {Object} jqXHR
    @param  {Object} jsonPayload
    @return {Object} jsonPayload
    @protected
  */
  ajaxSuccess: function(jqXHR, jsonPayload) {
    return jsonPayload;
  },

  /**
    Takes an ajax response, and returns an error payload.
    Returning a `DS.InvalidError` from this method will cause the
    record to transition into the `invalid` state and make the
    `errors` object available on the record.
    This function should return the entire payload as received from the
    server.  Error object extraction and normalization of model errors
    should be performed by `extractErrors` on the serializer.
    Example
    ```javascript
    App.ApplicationAdapter = DS.RESTAdapter.extend({
      ajaxError: function(jqXHR) {
        var error = this._super(jqXHR);
        if (jqXHR && jqXHR.status === 422) {
          var jsonErrors = Ember.$.parseJSON(jqXHR.responseText);
          return new DS.InvalidError(jsonErrors);
        } else {
          return error;
        }
      }
    });
    ```
    Note: As a correctness optimization, the default implementation of
    the `ajaxError` method strips out the `then` method from jquery's
    ajax response (jqXHR). This is important because the jqXHR's
    `then` method fulfills the promise with itself resulting in a
    circular "thenable" chain which may cause problems for some
    promise libraries.
    @method ajaxError
    @param  {Object} jqXHR
    @param  {Object} responseText
    @return {Object} jqXHR
    @protected
  */
  ajaxError: function(jqXHR, responseText, errorThrown) {
    var isObject = jqXHR !== null && typeof jqXHR === 'object';

    if (!isObject) {
      return jqXHR;
    }

    if (jqXHR.status === 409) {
      var message = 'version conflict';
      if (jqXHR.responseJSON && jqXHR.responseJSON.error && jqXHR.responseJSON.error.msg) {
        message = jqXHR.responseJSON.error.msg;
      }
      return new ConcurrentModificationError(message);
    }

    jqXHR.then = null;
    if (!jqXHR.errorThrown) {
      if (typeof errorThrown === 'string') {
        jqXHR.errorThrown = new Error(errorThrown);
      } else {
        jqXHR.errorThrown = errorThrown;
      }
    }

    return jqXHR;
  }
});
