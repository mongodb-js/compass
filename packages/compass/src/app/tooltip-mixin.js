require('bootstrap/js/dropdown');
require('bootstrap/js/collapse');
require('bootstrap/js/tooltip');

module.exports = {
  tooltip: function(opts) {
    return $(opts.el || this.el).tooltip(opts);
  }
};
