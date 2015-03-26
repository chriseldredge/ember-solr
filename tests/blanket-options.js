/* globals blanket */

blanket.options({
   modulePrefix: "dummy",
   filter: "//.*ember-solr/.*/",
   antifilter: "//.*(tests|template).*/",
   loaderExclusions: [],
   enableCoverage: true
});
