var AmpersandCollection = require('ampersand-collection'),
  lodashMixin = require('ampersand-collection-lodash-mixin'),
  _ = require('lodash');

var ChildCollection = module.exports = AmpersandCollection.extend(lodashMixin, {
  set: function(models, options) {
    // set model parent to collection's parent, schema of parent
    var parent = this.parent;
    options = _.defaults({
      parent: parent,
      schema: parent ? parent.schema : null,
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
