var AmpersandView = require('ampersand-view');
var _ = require('lodash');
var raf = require('raf');
var $ = require('jquery');

var VizView = AmpersandView.extend({
  _values: {},
  _autoWidth: false,
  _autoHeight: false,
  props: {
    data: 'any',
    className: 'any',
    vizFn: 'any',
    debounceRender: {
      type: 'boolean',
      default: true
    },
    renderMode: {
      type: 'string',
      values: ['canvas', 'svg', 'html'],
      default: 'svg'
    },
    width: {
      type: 'any',
      default: 'auto'
    },
    height: {
      type: 'any',
      default: 400
    }
  },
  bindings: {
    width: {
      type: 'attribute',
      name: 'width',
      hook: 'viz-container'
    },
    height: {
      type: 'attribute',
      name: 'height',
      hook: 'viz-container'
    },
    className: {
      type: 'attribute',
      name: 'class',
      hook: 'viz-container'
    }
  },
  initialize: function() {
    if (this.width === 'auto' || this.width === undefined) {
      this._autoWidth = true;
      this.width = 0;
    }
    if (this.height === 'auto' || this.height === undefined) {
      this._autoHeight = true;
      this.height = 0;
    }

    if (this._autoWidth || this._autoHeight) {
      if (this.debounceRender) {
        window.addEventListener('resize', _.debounce(this.redraw.bind(this), 100));
      } else {
        window.addEventListener('resize', this.redraw.bind(this));
      }
    }

    // pick canvas or svg template
    if (!this.template) {
      switch (this.renderMode) {
        case 'canvas':
          this.template = '<canvas data-hook="viz-container" id="canvas"></canvas>';
          break;
        case 'svg':
          this.template = '<svg data-hook="viz-container"></svg>';
          break;
        case 'html':
        default:
          this.template = '<div data-hook="viz-container"></div>';
          break;
      }
    }
  },

  _measure: function() {
    if (this.el) {
      if (this._autoWidth) {
        this.width = $(this.el).parent().width();
      }
      if (this._autoHeight) {
        this.height = $(this.el).parent().height();
      }
    }
  },

  _chooseDataSource: function() {
    if (this.model !== undefined) {
      this.data = this.model;
    } else if (this.collection !== undefined) {
      this.data = this.collection.toJSON();
    }
  },

  remove: function() {
    window.removeEventListener('resize', this._onResize);
    return AmpersandView.prototype.remove.call(this);
  },

  transform: function(data) {
    return data;
  },

  render: function() {
    this._chooseDataSource();
    this.data = this.transform(this.data);
    this.renderWithTemplate(this);

    // measure only if width or height is missing
    this._measure();

    // call viz function
    if (this.vizFn) {
      var opts = {
        width: this.width,
        height: this.height,
        data: this.data,
        el: this.el
      };
      var vizFn = this.vizFn.bind(this, opts);
      raf(function minicharts_viz_call_vizfn() {
        vizFn();
      });
    }
    return this;
  }
});

module.exports = VizView;

/**
 * Shortcut so you don't have to know anything about; ampersand
 * and can just cut right to the d3.
 * @param {String} className - CSS class to wrap the canvas in.
 * @param {Function} vizFn - @see `./d3fns`
 * @return {VizView}
 */
module.exports.create = function(className, vizFn) {
  return module.exports.extend({
    className: className,
    vizFn: vizFn
  });
};
