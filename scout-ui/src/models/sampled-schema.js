var es = require('event-stream');
var _ = require('underscore');
var debug = require('debug')('scout-ui:models:sampled-schema');
var scout = require('../../scout-client')();

var unwindFields = function() {
  return es.map(function(fields, done) {
    _.each(fields, function(field) {
      this.emit('data', field);
    }, this);

    done();
  });
};

var FieldCollection = {};

var SampledSchema = AmpersandModel.extend({
  children: {
    fields: FieldCollection
  },
  analyze: function(sampledField, done) {
    if (this.fields.get(sampledField._id)) {
      debug('already have the field %j', sampledField);
      return done();
    }
  },
  fetch: function(options) {
    options = _.defaults(options, {
      size: 5,
      query: {},
      fields: null
    });

    var schema = this;

    scout.sample('dyno.runs', options)
    .pipe(require('mongodb-infer'))
    .pipe(unwindFields())
    .pipe(es.map(function(field, done) {
      var self = this;
      schema.analyze(field, function(err, res) {
        if (err) return self.emit('error', err);
        done(null, res);
      });
    }));
  }
});

/**
 *
 * ```javascript
 * var schema = new SampledSchema({
 *   ns: 'dyno.runs'
 * });
 * schema.fetch();
```
*/
