var View = require('ampersand-view');
var raf = require('raf');

var ListView = View.extend({
  props: {
    itemViewClass: {
      type: 'any',
      default: null
    },
    nested: {
      type: 'object',
      default: null,
      required: false
    }
  },
  bindings: {
    nested: {
      type: 'booleanClass',
      yes: 'root'
    }
  },
  template: require('./list.jade'),
  render: function() {
    this.renderWithTemplate(this);
    this.renderCollection(this.collection, this.itemViewClass,
      this.queryByHook('item-container'), {
        viewOptions: {
          parent: this,
          nested: this.nested || null
        }
      }
    );
  },
  show: function(model) {
    var parent = this.parent;
    raf(function() {
      parent.show(model);
    });
  }
});

module.exports = ListView;
