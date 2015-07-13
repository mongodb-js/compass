var View = require('ampersand-view');
var format = require('util').format;
var _ = require('lodash');
var numeral = require('numeral');
var tooltipMixin = require('../tooltip-mixin');
var $ = require('jquery');

module.exports = View.extend(tooltipMixin, {
  template: require('./type-list-item.jade'),
  namespace: 'TypeListItem',
  bindings: {
    'model.name': [
      {
        hook: 'name'
      },
      {
        hook: 'bar',
        type: function(el) {
          el.classList.add('schema-field-type-' + this.model.getId().toLowerCase());
        }
      }
    ]
  },
  events: {
    'click .schema-field-wrapper': 'typeClicked'
  },
  initialize: function() {
    this.listenTo(this.model, 'change:probability', _.debounce(this.update.bind(this), 300));
  },
  update: function() {
    var tooltext = format('%s (%s)', this.model.getId(),
      numeral(this.model.probability).format('%'));
    // need to set `title` and `data-original-title` due to bug in bootstrap's tooltip
    // @see https://github.com/twbs/bootstrap/issues/14769
    this.tooltip({
      title: tooltext
    }).attr('data-original-title', tooltext);
    $(this.queryByHook('bar')).css({
      width: Math.floor(this.model.probability * 100) + '%'
    });
  },
  typeClicked: function() {
    var fieldList = this.parent.parent;
    if (!fieldList.minichartModel || fieldList.minichartModel.modelType !== this.model.modelType) {
      fieldList.switchView(this.model);
    }
  },
  render: function() {
    this.renderWithTemplate(this);
    this.update();
    return this;
  }
});
