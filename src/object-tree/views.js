var AmpersandView = require('ampersand-view');

var JSMemberView = AmpersandView.extend({
  template: require('./jsmember-view.jade'),
  props: {
    expanded: {
      type: 'boolean',
      default: false
    }
  },
  events: function() {
    var events = {};
    events['click .key-' + this.cid] = 'keyOrCaretClicked';
    return events;
  },
  bindings: {
    'model.key': '[data-hook=key]',
    expanded: [
      {
        type: 'booleanClass',
        yes: 'expanded',
        no: 'collapsed'
      }
    ]
  },
  subviews: {
    value: {
      hook: 'value-subview',
      waitFor: 'model.value',
      prepareView: function(el) {
        var viewClass = this.model.value.className + 'View';
        return new module.exports[viewClass]({
          el: el,
          model: this.model.value
        });
      }
    }
  },
  keyOrCaretClicked: function(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    this.toggle('expanded');
  }
});

var JSObjectView = AmpersandView.extend({
  template: require('./jsobject-view.jade'),
  render: function() {
    this.renderWithTemplate(this);
    this.renderCollection(this.model.members, JSMemberView,
      this.queryByHook('members-container')
    );
  }
});

var JSPrimitiveValueView = AmpersandView.extend({
  template: require('./jsprimvalue-view.jade')
});

var JSArrayItemView = AmpersandView.extend({
  props: {
    expanded: {
      type: 'boolean',
      default: false
    }
  },
  template: require('./jsarrayitem-view.jade'),
  events: function() {
    var events = {};
    events['click #value-' + this.cid] = 'valueOrCaretClicked';
    return events;
  },
  bindings: {
    expanded: [
      {
        type: 'booleanClass',
        yes: 'expanded',
        no: 'collapsed'
      }
    ]
  },
  subviews: {
    item: {
      hook: 'item-subview',
      prepareView: function(el) {
        var viewClass = this.model.className + 'View';
        return new module.exports[viewClass]({
          el: el,
          model: this.model
        });
      }
    }
  },
  valueOrCaretClicked: function(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    this.toggle('expanded');
  }
});

var JSArrayView = AmpersandView.extend({
  template: require('./jsarray-view.jade'),
  render: function() {
    this.renderWithTemplate(this);
    this.renderCollection(this.model.values, JSArrayItemView, this.queryByHook('values-container'));
  }
});

module.exports = {
  JSObjectView: JSObjectView,
  JSMemberView: JSMemberView,
  JSPrimitiveValueView: JSPrimitiveValueView,
  JSArrayView: JSArrayView
};
