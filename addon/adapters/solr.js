/**
  @module solr
*/

import Ember from 'ember';
import DS from 'ember-data';

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
    Specifies a default handler to send requests to.
    Standard Solr configurations include request handlers
    like `/select`, `/search`, `/get`, etc.

    @property defaultHandler
    @type {string}
    @default '/select'
  */
  defaultHandler: '/select',

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

  find: function(store, type, id) {
    // TODO: support real-time get handler
    return this.findQuery(store, type, {q: 'id:' + id});
  },

  findQuery: function(store, type, query) {
    var URL = this.buildURL(type.typeKey);
    var solrQuery = this.buildSolrQuery(type.typeKey, query);
    var options = {
      data: solrQuery,
    };

    return this.ajax(URL, 'GET', options);
  },

  /**
    Builds a Solr query to send in a request.
    This method applies some defaults and converts
    idiomatic Ember query parameters to their
    Solr corollaries.

    * Sets `wt=json`
    * Converts `limit` to `rows`
    * Converts `offset` to `start`
    * Defaults to `q=*:*` when no query is specified

    Overrides of this method can return an object that includes
    other query options. Multipe `fq` parameters (and others)
    can be defined by using an array for the value:
    ```javascript
    App.ApplicationAdapter = SolrAdapter.extend({
      buildSolrQuery: function(type, query) {
        return {
          fq: ['type:' + type, 'public:true']
        };
      }
    });
    ```

    See [QueryResponseWriter](https://wiki.apache.org/solr/QueryResponseWriter)
    and [CommonQueryParameters](https://wiki.apache.org/solr/CommonQueryParameters).

    @method buildSolrQuery
    @param {String} type
    @param {Object} query
    @return {Object} data hash for ajax request
  */
  buildSolrQuery: function(type, query) {
    var solrQuery = {
      wt: 'json',
      fq: []
    };

    if (query.limit) {
      solrQuery.rows = query.limit;
    }

    if (query.offset) {
      solrQuery.start = query.offset;
    }

    var typeFilter = this.filterQueryForType(type);
    if (typeFilter) {
      solrQuery.fq.push(typeFilter);
    }

    solrQuery.q = query.q || '*:*';

    return solrQuery;
  },

  /**
    Combines
    {{#crossLink "SolrAdapter/baseURL:property"}}{{/crossLink}},
    {{#crossLink "SolrAdapter/coreForType:method"}}{{/crossLink}},
    and
    {{#crossLink "SolrAdapter/handlerForType:method"}}{{/crossLink}}
    into a request URL.
    @method buildURL
    @param {String} type
    @return {String} A relative or absolute URL
  */
  buildURL: function(type) {
    return this.combinePath(
      this.get('baseURL'),
      this.coreForType(type),
      this.handlerForType(type));
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
  combinePath: function(path1, path2) {
    var s = path1;

    for (var i = 1; i < arguments.length; i++) {
      var part = arguments[i];
      if (!part) continue;

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
    Determines which Solr Core should handle queries for
    a given type. By default, {{#crossLink "SolrAdapter/defaultCore:property"}}{{/crossLink}}
    is used.
    @method coreForType
    @param {String} type
    @return {String} core name
  */
  coreForType: function(type) {
    return this.get('defaultCore');
  },

  /**
    Determines which Solr Core should handle queries for
    a given type. By default, {{#crossLink "SolrAdapter/defaultHandler:property"}}{{/crossLink}}
    is used.
    @method handlerForType
    @param {String} type
    @return {String} handler
  */
  handlerForType: function(type) {
    return this.get('defaultHandler');
  },

  /**
    Builds an optional filter query (`fq`) to include in requests.
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
    @return {String} a filter query or `null`
  */
  filterQueryForType: function(type) {
    return null;
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
  */
  ajax: function(url, type, options) {
    var adapter = this;

    return new Ember.RSVP.Promise(function(resolve, reject) {
      var hash = adapter.ajaxOptions(url, type, options);

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
  */
  ajaxOptions: function(url, type, options) {
    var hash = options || {};
    hash.url = url;
    hash.type = type;
    hash.dataType = this.get('dataType') || 'json';
    hash.context = this;
    hash.traditional = true;

    if (hash.dataType === 'jsonp') {
      hash.jsonp = 'json.wrf';
    }

    if (hash.data && type !== 'GET') {
      hash.contentType = 'application/json; charset=utf-8';
      hash.data = JSON.stringify(hash.data);
    }

    var headers = this.get('headers');
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
  */
  ajaxError: function(jqXHR, responseText, errorThrown) {
    var isObject = jqXHR !== null && typeof jqXHR === 'object';

    if (isObject) {
      jqXHR.then = null;
      if (!jqXHR.errorThrown) {
        if (typeof errorThrown === 'string') {
          jqXHR.errorThrown = new Error(errorThrown);
        } else {
          jqXHR.errorThrown = errorThrown;
        }
      }
    }

    return jqXHR;
  }
});
