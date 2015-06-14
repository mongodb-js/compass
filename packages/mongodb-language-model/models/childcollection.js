var AmpersandCollection = require('ampersand-collection'),
  lodashMixin = require('ampersand-collection-lodash-mixin'),
  _ = require('lodash');

/**
 * ChildCollection is a regular AmpersandCollection with the lodash mixin and
 * additionally listens to any change:buffer events of its children and calls
 * its parent's bufferChanged method.
 *
 * @type {AmpersandCollection}
 */
var ChildCollection = module.exports = AmpersandCollection.extend(lodashMixin, {
  set: function(models, options) {
    // set model parent to collection's parent
    var parent = this.parent;
    options = _.defaults({
      parent: parent,
      parse: true
    }, options || {});

    var children = AmpersandCollection.prototype.set.call(this, models, options);
    if (!parent) return children;
    // add parent listener on children for buffer change
    var _children = (children instanceof Array) ? children.slice() : [children];
    _children.forEach(function(child) {
      parent.listenTo(child, 'change:buffer', parent.bufferChanged);
    });

    // add parent listener for collection change
    parent.listenTo(this, 'add reset remove', parent.bufferChanged);

    return children;
  }
});
