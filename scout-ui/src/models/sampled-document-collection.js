var _ = require('lodash');
var es = require('event-stream');
var app = require('ampersand-app');
var DocumentCollection = require('../../../scout-brain').models.DocumentCollection;

module.exports = DocumentCollection.extend({
  namespace: 'SampledDocumentCollection',
  initialize: function() {
    if (!this.parent) {
      throw new TypeError('SampledDocumentCollection must be used from a parent Collection.');
    }
  },
  fetch: function(options) {
    var model = this;
    var success = options.success;

    options = _.defaults((options ? _.clone(options) : {}), {
      size: 5,
      query: {},
      fields: null
    });

    app.client.sample(this.parent._id, options)
      .pipe(es.map(function(doc, cb) {
        model.add(doc);
        cb(null, doc);
      }))
      .pipe(es.wait(function(err, data) {
        if (err) return options.error({}, 'error', err.message);
        if (success) {
          success(model, data, options);
        }
        model.trigger('sync', model, data, options);
      }));
  }
});
