'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var React = require('react');
var PropTypes = require('prop-types');

/**
 * The base css class.
 */
var CLASS = 'element-value';

/**
 * General BSON double value component.
 */

var Int32 = function (_React$Component) {
  _inherits(Int32, _React$Component);

  function Int32() {
    _classCallCheck(this, Int32);

    return _possibleConstructorReturn(this, (Int32.__proto__ || Object.getPrototypeOf(Int32)).apply(this, arguments));
  }

  _createClass(Int32, [{
    key: 'render',


    /**
     * Render a single generic BSON value.
     *
     * @returns {React.Component} The element component.
     */
    value: function render() {
      var value = String(this.props.value.valueOf());
      return React.createElement(
        'div',
        { className: CLASS + ' ' + CLASS + '-is-' + this.props.type.toLowerCase(), title: value },
        value
      );
    }
  }]);

  return Int32;
}(React.Component);

Int32.displayName = 'Int32Value';

Int32.propTypes = {
  type: PropTypes.string.isRequired,
  value: PropTypes.any.isRequired
};

module.exports = Int32;