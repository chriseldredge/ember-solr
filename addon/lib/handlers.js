/**
  @module solr
*/

import Ember from 'ember';

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
  method: 'GET'
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
  path: 'select'
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
  path: 'get'
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
    @propery method
    @default 'POST'
  */
  method: 'POST'
});

export {
  SolrHandlerType,
  SolrRequestHandler,
  SolrSearchHandler,
  SolrRealTimeGetHandler,
  SolrUpdateHandler
};
