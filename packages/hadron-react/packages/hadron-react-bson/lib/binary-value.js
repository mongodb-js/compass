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
 * Base 64 constant.
 */


var BASE_64 = 'base64';

/**
 * The component class name.
 */
var CLASS = 'element-value element-value-is-binary';

/**
 * BSON Binary value component.
 */

var Binary = function (_React$Component) {
  _inherits(Binary, _React$Component);

  function Binary() {
    _classCallCheck(this, Binary);

    return _possibleConstructorReturn(this, (Binary.__proto__ || Object.getPrototypeOf(Binary)).apply(this, arguments));
  }

  _createClass(Binary, [{
    key: 'renderValue',


    /**
     * Render the value as a string.
     *
     * @returns {String} The binary value.
     */
    value: function renderValue() {
      var type = this.props.value.sub_type;
      var buffer = this.props.value.buffer;
      return 'Binary(\'' + truncate(buffer.toString(BASE_64), 100) + '\')';
    }

    /**
     * Render a BSON binary value.
     *
     * @returns {React.Component} The element component.
     */

  }, {
    key: 'render',
    value: function render() {
      var value = this.renderValue();
      return React.createElement(
        'div',
        { className: CLASS, title: value },
        value
      );
    }
  }]);

  return Binary;
}(React.Component);

Binary.displayName = 'BinaryValue';

Binary.propTypes = {
  type: PropTypes.string,
  value: PropTypes.any.isRequired
};

module.exports = Binary;