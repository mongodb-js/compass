'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var React = require('react');
var PropTypes = require('prop-types');

/**
 * The button constant.
 */
var BUTTON = 'button';

/**
 * Component for a button with text.
 */

var TextButton = function (_React$Component) {
  _inherits(TextButton, _React$Component);

  function TextButton() {
    _classCallCheck(this, TextButton);

    return _possibleConstructorReturn(this, (TextButton.__proto__ || Object.getPrototypeOf(TextButton)).apply(this, arguments));
  }

  _createClass(TextButton, [{
    key: 'render',


    /**
     * Render the button.
     *
     * @returns {Component} The button component.
     */
    value: function render() {
      return React.createElement(
        'button',
        {
          id: this.props.id,
          className: this.props.className,
          'data-test-id': this.props.dataTestId,
          type: BUTTON,
          disabled: this.props.disabled,
          style: this.props.style,
          onClick: this.props.clickHandler },
        this.props.text
      );
    }
  }]);

  return TextButton;
}(React.Component);

TextButton.displayName = 'TextButton';

TextButton.propTypes = {
  text: PropTypes.string.isRequired,
  clickHandler: PropTypes.func.isRequired,
  className: PropTypes.string,
  dataTestId: PropTypes.string,
  disabled: PropTypes.bool,
  id: PropTypes.string,
  style: PropTypes.object
};

module.exports = TextButton;