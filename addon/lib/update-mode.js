/**
  @module solr
*/

/**
  An enumeration of update modes that control
  how updates are persisted to Solr.

  See [Updating Parts of Documents](https://cwiki.apache.org/confluence/display/solr/Updating+Parts+of+Documents)
  on the Solr wiki.

  @class SolrUpdateMode
  @static
*/
const SolrUpdateMode = {
  /**
    Uses the `_version_` field (or other user configurable field)
    as a token to ensure that the document being replaced/updated
    has not been concurrently modified by another client.

    This is the safest mode to ensure writes from multiple clients
    do not collide which can manifest in updates appearing temporarily
    and then appearing to revert to an older value.

    @property OptimisticConcurrency
    @final
    @type {string}
  */
  OptimisticConcurrency: 'SolrUpdateMode.OptimisticConcurrency',

  /**
    Sets the `_version_` field (or other user configurable field)
    value to `0` (zero) to cause the document to be added if it
    does not exist or overwrite any previous version if it does
    exist.

    @property LastWriteWins
    @final
    @type {string}
  */
  LastWriteWins: 'SolrUpdateMode.LastWriteWins',

  /**
    Sends documents to Solr without includng any
    `_version_` field at all. Depending on the Solr
    server config, this may result in similar behavior to
    `LastWriteWins`, or it may result in updates being discarded
    entirely.

    @property None
    @final
    @type {string}
  */
  None: 'SolrUpdateMode.None'
};

export default SolrUpdateMode;
