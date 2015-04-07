/**
  @module solr
*/

/**
  An enumeration of types of commit commands (hard or soft)

  See [NearRealtimeSearch](https://wiki.apache.org/solr/NearRealtimeSearch)
  on the Solr wiki.

  @class SolrCommitType
  @static
*/
const SolrCommitType = {
  /**
    A standard "hard" commit that causes all pending changes to be
    flushed to disk and for searcher to be reloaded.

    This commit type provides the highest level of durability by
    flushing changes to disk but causes a large amount of I/O on
    the server.

    @property Hard
    @final
    @type {string}
  */
  Hard: 'SolrCommitType.Hard',

  /**
    A "soft" commit that causes searchers to reload with pending
    changes so they become visible outside of the Real-Time Get handler.

    This commit type provides less durability in the event of a Solr server
    crash but still allows Solr searches to stay up to date.

    @property Soft
    @final
    @type {string}
  */
  Soft: 'SolrCommitType.Soft',

  /**
    Tells EmberSolr not to send any commit command to Solr.
    Updates will be visible by Near Real Time handlers but
    won't become visible to standard query handlers until
    an autoCommit, autoSoftCommit or another request commits.

    @property None
    @final
    @type {string}
  */
  None: 'SolrCommitType.None'
};

export default SolrCommitType;
