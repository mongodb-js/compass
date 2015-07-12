var raf = require('raf');

var FastView = {
  fetch: function(model, options) {
    raf(function() {
      model.fetch(options);
    });
  },
  renderSubview: function(SubViewClass, options) {
    var parent = this;

    raf(function fast_render_subview() {
      var subview = new SubViewClass(options);
      subview.render();
      parent.registerSubview(subview);
    });
  }
};

module.exports = FastView;
