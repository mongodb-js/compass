/* eslint no-use-before-define: 0, one-var: 0, no-else-return: 0, no-unused-vars: 0, eqeqeq: 0, no-shadow: 0, yoda: 0, consistent-return: 0, one-var: 0, camelcase: 0 */
// d3.tip
// Copyright (c) 2013 Justin Palmer
//
// Tooltips for d3.js SVG visualizations

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    // CommonJS
    module.exports = function (d3) {
      d3.tip = factory(d3);
      return d3.tip;
    };
  } else {
    // Browser global.
    root.d3.tip = factory(root.d3);
  }
})(this, function (d3) {
  // Public - contructs a new tooltip
  //
  // Returns a tip
  return function () {
    let direction = d3_tip_direction;
    let offset = d3_tip_offset;
    let node = initNode();
    let html = d3_tip_html;
    let svg = null;
    let point = null;
    let target = null;

    function tip(vis) {
      svg = getSVGNode(vis);
      if (!svg) {
        return;
      }
      point = svg.createSVGPoint();
      document.body.appendChild(node);
    }

    // Public - show the tooltip on the screen
    //
    // Returns a tip
    tip.show = function () {
      const args = Array.prototype.slice.call(arguments);
      if (args[args.length - 1] instanceof SVGElement) {
        target = args.pop();
      }

      const content = html.apply(this, args),
        poffset = offset.apply(this, args),
        dir = direction.apply(this, args),
        nodel = getNodeEl(),
        scrollTop =
          document.documentElement.scrollTop || document.body.scrollTop,
        scrollLeft =
          document.documentElement.scrollLeft || document.body.scrollLeft;

      let i = directions.length,
        coords = null;

      nodel.html(content).style({
        opacity: 1,
        'pointer-events': 'all',
        display: 'block',
      });

      while (i--) {
        nodel.classed(directions[i], false);
      }
      coords = direction_callbacks.get(dir).apply(this);
      nodel.classed(dir, true).style({
        top: (coords.top + poffset[0] + scrollTop).toString() + 'px',
        left: (coords.left + poffset[1] + scrollLeft).toString() + 'px',
      });

      return tip;
    };

    // Public - hide the tooltip
    //
    // Returns a tip
    tip.hide = function () {
      const nodel = getNodeEl();
      nodel.style({
        opacity: 0,
        'pointer-events': 'none',
        display: 'none',
      });
      return tip;
    };

    // Public: Proxy attr calls to the d3 tip container.  Sets or gets attribute value.
    //
    // n - name of the attribute
    // v - value of the attribute
    //
    // Returns tip or attribute value
    tip.attr = function (n, v) {
      if (arguments.length < 2 && typeof n === 'string') {
        return getNodeEl().attr(n);
      } else {
        const args = Array.prototype.slice.call(arguments);
        d3.selection.prototype.attr.apply(getNodeEl(), args);
      }

      return tip;
    };

    // Public: Proxy style calls to the d3 tip container.  Sets or gets a style value.
    //
    // n - name of the property
    // v - value of the property
    //
    // Returns tip or style property value
    tip.style = function (n, v) {
      if (arguments.length < 2 && typeof n === 'string') {
        return getNodeEl().style(n);
      } else {
        const args = Array.prototype.slice.call(arguments);
        d3.selection.prototype.style.apply(getNodeEl(), args);
      }

      return tip;
    };

    // Public: Set or get the direction of the tooltip
    //
    // v - One of n(north), s(south), e(east), or w(west), nw(northwest),
    //     sw(southwest), ne(northeast) or se(southeast)
    //
    // Returns tip or direction
    tip.direction = function (v) {
      if (!arguments.length) {
        return direction;
      }
      direction = v == null ? v : d3.functor(v);

      return tip;
    };

    // Public: Sets or gets the offset of the tip
    //
    // v - Array of [x, y] offset
    //
    // Returns offset or
    tip.offset = function (v) {
      if (!arguments.length) {
        return offset;
      }
      offset = v == null ? v : d3.functor(v);

      return tip;
    };

    // Public: sets or gets the html value of the tooltip
    //
    // v - String value of the tip
    //
    // Returns html value or tip
    tip.html = function (v) {
      if (!arguments.length) {
        return html;
      }
      html = v == null ? v : d3.functor(v);

      return tip;
    };

    // Public: destroys the tooltip and removes it from the DOM
    //
    // Returns a tip
    tip.destroy = function () {
      if (node) {
        getNodeEl().remove();
        node = null;
      }
      return tip;
    };

    function d3_tip_direction() {
      return 'n';
    }
    function d3_tip_offset() {
      return [0, 0];
    }
    function d3_tip_html() {
      return ' ';
    }

    const direction_callbacks = d3.map({
        n: direction_n,
        s: direction_s,
        e: direction_e,
        w: direction_w,
        nw: direction_nw,
        ne: direction_ne,
        sw: direction_sw,
        se: direction_se,
      }),
      directions = direction_callbacks.keys();

    function direction_n() {
      const bbox = getScreenBBox();
      return {
        top: bbox.n.y - node.offsetHeight,
        left: bbox.n.x - node.offsetWidth / 2,
      };
    }

    function direction_s() {
      const bbox = getScreenBBox();
      return {
        top: bbox.s.y,
        left: bbox.s.x - node.offsetWidth / 2,
      };
    }

    function direction_e() {
      const bbox = getScreenBBox();
      return {
        top: bbox.e.y - node.offsetHeight / 2,
        left: bbox.e.x,
      };
    }

    function direction_w() {
      const bbox = getScreenBBox();
      return {
        top: bbox.w.y - node.offsetHeight / 2,
        left: bbox.w.x - node.offsetWidth,
      };
    }

    function direction_nw() {
      const bbox = getScreenBBox();
      return {
        top: bbox.nw.y - node.offsetHeight,
        left: bbox.nw.x - node.offsetWidth,
      };
    }

    function direction_ne() {
      const bbox = getScreenBBox();
      return {
        top: bbox.ne.y - node.offsetHeight,
        left: bbox.ne.x,
      };
    }

    function direction_sw() {
      const bbox = getScreenBBox();
      return {
        top: bbox.sw.y,
        left: bbox.sw.x - node.offsetWidth,
      };
    }

    function direction_se() {
      const bbox = getScreenBBox();
      return {
        top: bbox.se.y,
        left: bbox.e.x,
      };
    }

    function initNode() {
      const node = d3.select(document.createElement('div'));
      node.style({
        position: 'absolute',
        top: 0,
        opacity: 0,
        'pointer-events': 'none',
        'box-sizing': 'border-box',
        display: 'none',
      });

      return node.node();
    }

    function getSVGNode(el) {
      el = el.node();
      if (!el) {
        return;
      }
      if (el.tagName.toLowerCase() === 'svg') {
        return el;
      }

      return el.ownerSVGElement;
    }

    function getNodeEl() {
      if (node === null) {
        node = initNode();
        // re-add node to DOM
        document.body.appendChild(node);
      }
      return d3.select(node);
    }

    // Private - gets the screen coordinates of a shape
    //
    // Given a shape on the screen, will return an SVGPoint for the directions
    // n(north), s(south), e(east), w(west), ne(northeast), se(southeast), nw(northwest),
    // sw(southwest).
    //
    //    +-+-+
    //    |   |
    //    +   +
    //    |   |
    //    +-+-+
    //
    // Returns an Object {n, s, e, w, nw, sw, ne, se}
    function getScreenBBox() {
      let targetel = target;
      if (!targetel) targetel = d3.event.target;

      while (
        'undefined' === typeof targetel.getScreenCTM &&
        'undefined' !== targetel.parentNode
      ) {
        targetel = targetel.parentNode;
      }

      const bbox = {};
      const matrix = targetel.getScreenCTM();
      const tbbox = targetel.getBBox();
      const width = tbbox.width;
      const height = tbbox.height;
      const x = tbbox.x;
      const y = tbbox.y;

      point.x = x;
      point.y = y;
      bbox.nw = point.matrixTransform(matrix);
      point.x += width;
      bbox.ne = point.matrixTransform(matrix);
      point.y += height;
      bbox.se = point.matrixTransform(matrix);
      point.x -= width;
      bbox.sw = point.matrixTransform(matrix);
      point.y -= height / 2;
      bbox.w = point.matrixTransform(matrix);
      point.x += width;
      bbox.e = point.matrixTransform(matrix);
      point.x -= width / 2;
      point.y -= height / 2;
      bbox.n = point.matrixTransform(matrix);
      point.y += height;
      bbox.s = point.matrixTransform(matrix);

      return bbox;
    }

    return tip;
  };
});
