var AmpersandView = require('ampersand-view');
var $ = require('jquery');
var format = require('util').format;

require('bootstrap/js/tooltip');

module.exports = AmpersandView.extend({
  bindings: {
    'model._id': [
      {
        hook: '_id'
      },
      {
        hook: 'bar',
        type: function(el) {
          $(el).attr('title', format('%s (%d%)', this.model._id, Math.min(this.model.probability * 100, 100)));
        }
      },
      {
        hook: 'bar',
        type: function(el) {
          $(el).addClass('schema-field-type-' + this.model.getId().toLowerCase());
        }
      }
    ],
    'model.count': [
      {
        hook: 'bar',
        type: function(el) {
          $(el).css({
            width: Math.min(this.model.probability * 100, 100) + '%'
          });
        }
      }
    ]
  },
  initialize: function() {
    this.listenTo(this, 'change:rendered', function() {
      // $(this.el).find('[data-toggle="tooltip"]').tooltip();
      $(this.el).tooltip();
    });
  },
  template: require('./type-list-item.jade')
});
