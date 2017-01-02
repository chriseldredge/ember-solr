/**
  @module solr
*/

import Ember from 'ember';

const get = Ember.get,
      set = Ember.set;

/**
  Represents an HTTP Request to a Solr server,
  including URL path segments, data and options
  that control how the request will be executed.

  Allows easy setting of data parameters (serialized
  as a query string for `GET` requests or a JSON string
  for other types).

  Construction of this class should either provide
  the `data` property or the `options` property,
  but not both.

  @class SolrRequest
  @extends Ember.Object
*/
export default Ember.Object.extend({
  /**
    The Solr Core to route the request to.
    When not specified, no core will be included
    in the path and the request will be routed
    to the default core on the server.

    @property core
    @type {string}
  */
  core: null,

  /**
    The handler to route the request to.

    @property handler
    @type {SolrRequestHandler}
  */
  handler: null,

  /**
    Data to send in the request.
    This property is bound to `options.data`.

    @property data
    @type {object}
  */
  data: null,

  /**
    Options hash that specifies how the request
    will be executed.
    `options.data` is bound to `data`.

    @property options
    @type {object}
  */
  options: null,

  /**
    Binds `handler.method` to `method` for convenience.
    Represents an HTTP method or verb, e.g. `GET`, `POST`,
    etc.

    @property method
    @type {string}
    @readonly
  */
  method: Ember.computed.oneWay('handler.method'),

  /**
    Initialization observer. Checks whether `options`,
    or `data` were provided, creates empty hash objects
    where they were not, and establishes a binding
    between `options.data` and `data`.

    @method _init
    @private
  */
  _init: Ember.on('init', function() {
    var data = get(this, 'data');
    var options = get(this, 'options');
    if (options && options.data && data) {
      throw new Error('SolrRequest accepts `data` or `options.data` but not both.');
    }

    if (!options) {
      options = {
        data: data || {}
      };
      set(this, 'options', options);
    } else if (!options.data) {
      options.data = data || {};
    }

    Ember.defineProperty(this, 'data', {get: function() {
      return this.get('options.data');
    }});
  })

});
