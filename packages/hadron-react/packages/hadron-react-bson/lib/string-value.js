'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var React = require('react');
var PropTypes = require('prop-types');

var _require = require('hadron-react-utils'),
    truncate = _require.truncate;

/**
 * The base css class.
 */


var CLASS = 'element-value';

/**
 * General BSON string value component.
 */

var StringValue = function (_React$Component) {
  _inherits(StringValue, _React$Component);

  function StringValue() {
    _classCallCheck(this, StringValue);

    return _possibleConstructorReturn(this, (StringValue.__proto__ || Object.getPrototypeOf(StringValue)).apply(this, arguments));
  }

  _createClass(StringValue, [{
    key: 'render',


    /**
     * Render a single generic BSON value.
     *
     * @returns {React.Component} The element component.
     */
    value: function render() {
      return React.createElement(
        'div',
        { className: CLASS + ' ' + CLASS + '-is-string', title: this.props.value },
        '"' + truncate(this.props.value, 70) + '"'
      );
    }
  }]);

  return StringValue;
}(React.Component);

StringValue.displayName = 'StringValue';

StringValue.propTypes = {
  type: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired
};

module.exports = StringValue;