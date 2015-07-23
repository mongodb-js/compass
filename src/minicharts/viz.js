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
    width: [
      // set width attribute for svg, canvas
      {
        type: 'attribute',
        name: 'width',
        hook: 'viz-container'
      },
      // set width style for html
      {
        type: function(el, value) {
          $(el).width(value);
        },
        hook: 'viz-container'
      }
    ],
    height: [
      // set height attribute for svg, canvas
      {
        type: 'attribute',
        name: 'height',
        hook: 'viz-container'
      },
      // set height style for html
      {
        type: function(el, value) {
          $(el).height(value);
        },
        hook: 'viz-container'
      }
    ],
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

    // pick html, canvas or svg template
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

  remove: function() {
    // @todo, _onResize not defined, is this correct?
    window.removeEventListener('resize', this._onResize);
    return AmpersandView.prototype.remove.call(this);
  },

  render: function() {
    this.renderWithTemplate(this);

    // measure only if width or height is missing
    this._measure();

    // call viz function
    if (this.vizFn) {
      var opts = {
        width: this.width,
        height: this.height,
        model: this.model,
        view: this,
        el: this.el
      };
      var vizFn = this.vizFn.bind(this, opts);
      raf(function minicharts_viz_call_vizfn() {
        vizFn();
      });
    }
    return this;
  },
  redraw: function() {
    // currently just an alias for render
    this.render();
  }
});

module.exports = VizView;
