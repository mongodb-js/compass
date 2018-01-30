'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var moment = require('moment-timezone');
var React = require('react');
var PropTypes = require('prop-types');

/**
 * The component class.
 */
var CLASS = 'element-value element-value-is-date';

/**
 * The date format.
 */
var FORMAT = 'YYYY-MM-DD HH:mm:ss.SSS';

/**
 * BSON Date component.
 */

var DateValue = function (_React$Component) {
  _inherits(DateValue, _React$Component);

  function DateValue() {
    _classCallCheck(this, DateValue);

    return _possibleConstructorReturn(this, (DateValue.__proto__ || Object.getPrototypeOf(DateValue)).apply(this, arguments));
  }

  _createClass(DateValue, [{
    key: 'render',


    /**
     * Render a BSON date.
     *
     * @returns {React.Component} The element component.
     */
    value: function render() {
      var time = moment(this.props.value);
      if (this.props.tz) {
        time.tz(this.props.tz);
      }
      var value = time.format(FORMAT);
      return React.createElement(
        'div',
        { className: CLASS, title: value },
        value
      );
    }
  }]);

  return DateValue;
}(React.Component);

DateValue.displayName = 'DateValue';

DateValue.propTypes = {
  type: PropTypes.string.isRequired,
  value: PropTypes.any.isRequired,
  tz: PropTypes.string
};

module.exports = DateValue;