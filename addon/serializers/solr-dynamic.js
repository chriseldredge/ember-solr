import Ember from 'ember';
import SolrSerializer from './solr';

/**
  Ember Data Serializer for Apache Solr [Dynamic Fields](https://cwiki.apache.org/confluence/display/solr/Dynamic+Fields).


  @class SolrDynamicSerializer
  @extends SolrSerializer
*/
export default SolrSerializer.extend({
  /**
    Provides a mapping of types to dynamic field prefixes.

    The following example would cause all attributes of type `number`
    to be mapped by prepending `int_` to the attribute name:

    ```javascript
    App.ApplicationSerializer = SolrDynamicSerializer.extend({
      dynamicFieldPrefixes: {
        'number': 'int_'
      }
    });
    ```

    This property is left null to follow the conventions in the
    Solr Schemaless example configuration.

    @property dynamicFieldPrefixes
    @type {object}
    @default null
  */
  dynamicFieldPrefixes: null,

  /**
    Provides a mapping of types to dynamic field prefixes.

    The following example would cause all attributes of type `date`
    to be mapped by appending `_date` to the attribute name:

    ```javascript
    App.ApplicationSerializer = SolrdynamicSerializer.extend({
      dynamicFieldSuffixes: {
        'date': '_date'
      }
    });
    ```

    See source code for default mappings that follow
    conventions in the Solr Dynamic example configuration.

    @property dynamicFieldSuffixes
    @type {object}
    @default null
  */
  dynamicFieldSuffixes: {
    'boolean': '_b',
    'booleans': '_bs',
    'date': '_dt',
    'dates': '_dts',
    'double': '_d',
    'doubles': '_ds',
    'float': '_f',
    'floats': '_fs',
    'int': '_i',
    'ints': '_is',
    'long': '_l',
    'longs': '_ls',
    'number': '_i',
    'numbers': '_is',
    'string': '_s',
    'strings': '_ss',
    'text': '_txt'
  },

  /**
    Converts attributes to underscore and uses
    {{#crossLink "SolrAdapter/dynamicKeyForAttribute:method"}}{{/crossLink}}.
    to produce a dynamic field key. For a string attribute like `relatedArticles`
    this method would return `related_articles_s`.

    @method keyForAttribute
    @param {string} attr
    @return {string} key
  */
  keyForAttribute: function(attr) {
    attr = this.dynamicKeyForAttribute(attr);
    return Ember.String.underscore(attr);
  },

  /**
    Uses
    {{#crossLink "SolrAdapter/dynamicFieldPrefixes:property"}}{{/crossLink}}
    and
    {{#crossLink "SolrAdapter/dynamicFieldSuffixes:property"}}{{/crossLink}}
    to produce a dynamic field key. For a string attribute like `related_articles`
    this method would return `related_articles_s`.

    @method dynamicKeyForAttribute
    @param {string} attr
    @return {string} key
  */
  dynamicKeyForAttribute: function(attr) {
    var prefixes = this.get('dynamicFieldPrefixes'),
        suffixes = this.get('dynamicFieldSuffixes');

    if (!prefixes && !suffixes) {
      return attr;
    }

    if (!this.currentType) {
      throw new Error('Cannot determine dynamic field without type metadata');
    }

    var meta = this.currentType.metaForProperty(attr);
    var attrType = meta.type || 'string';

    if (prefixes && prefixes[attrType]) {
      attr = prefixes[attrType] + attr;
    }
    if (suffixes && suffixes[attrType]) {
      attr += suffixes[attrType];
    }

    return attr;
  },

  normalize: function(type) {
    this.currentType = type;
    return this._super.apply(this, arguments);
  },

  serialize: function(snapshot) {
    this.currentType = snapshot.type;
    return this._super.apply(this, arguments);
  }
});
