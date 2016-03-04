var State = require('ampersand-state');
var Collection = require('ampersand-rest-collection');

var DocumentModel = State.extend({
  idAttribute: '_id',
  extraProperties: 'allow'
});

var DocumentCollection = Collection.extend({
  model: DocumentModel,
  comparator: '_id'
});


var SampledDocumentCollection = DocumentCollection.extend({
  /**
   * Don't do client-side sorting as the cursor on the server-side handles sorting.
   */
  comparator: false,
  namespace: 'SampledDocumentCollection'
});

module.exports = SampledDocumentCollection;
