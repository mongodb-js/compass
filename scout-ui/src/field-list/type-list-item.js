var AmpersandView = require('ampersand-view');
var $ = require('jquery');
var format = require('util').format;

require('bootstrap/js/tooltip');

module.exports = AmpersandView.extend({
  bindings: {
    'model._id': [
      {
        hook: '_id'
      },,
      {
        hook: 'bar',
        type: function(el) {
          $(el).addClass('schema-field-type-' + this.model.getId().toLowerCase());
        }
      }
    ],
    'model.probability': [
      {
        hook: 'bar',
        type: function(el) {
          var percent = Math.min(this.model.probability * 100, 100);
          $(el).css({
            width: percent + '%'
          });
          if (percent) {
            $(el).tooltip({
              title: format('%s (%d%)', this.model.getId(), percent)
            });
          }
        }
      }
    ]
  },
  template: require('./type-list-item.jade')
});
