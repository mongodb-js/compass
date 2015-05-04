var AmpersandView = require('ampersand-view');
var $ = require('jquery');

module.exports = AmpersandView.extend({
  bindings: {
    'model._id': [
      {
        hook: '_id'
      },
      {
        hook: 'bar',
        type: 'text'
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
  template: require('./type-list-item.jade')
});
