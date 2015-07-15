var DocumentCollection = require('scout-brain').models.DocumentCollection;

module.exports = DocumentCollection.extend({
  /**
   * Don't do client-side sorting as the cursor on the server-side handles sorting.
   */
  comparator: false,
  namespace: 'SampledDocumentCollection'
});
