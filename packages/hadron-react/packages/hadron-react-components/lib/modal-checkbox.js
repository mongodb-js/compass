'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var React = require('react');
var PropTypes = require('prop-types');

var _require = require('./info-sprinkle'),
    InfoSprinkle = _require.InfoSprinkle;

/**
 * A checkbox in the create collection dialog.
 */


var ModalCheckbox = function (_React$Component) {
  _inherits(ModalCheckbox, _React$Component);

  function ModalCheckbox() {
    _classCallCheck(this, ModalCheckbox);

    return _possibleConstructorReturn(this, (ModalCheckbox.__proto__ || Object.getPrototypeOf(ModalCheckbox)).apply(this, arguments));
  }

  _createClass(ModalCheckbox, [{
    key: 'render',


    /**
     * Render the input.
     *
     * @returns {React.Component} The react component.
     */
    value: function render() {
      return React.createElement(
        'div',
        null,
        React.createElement(
          'label',
          null,
          React.createElement('input', {
            type: 'checkbox',
            onChange: this.props.onClickHandler,
            checked: this.props.checked,
            className: this.props.inputClassName }),
          React.createElement(
            'p',
            { className: this.props.titleClassName },
            this.props.name
          )
        ),
        React.createElement(InfoSprinkle, {
          helpLink: this.props.helpUrl,
          onClickHandler: this.props.onLinkClickHandler })
      );
    }
  }]);

  return ModalCheckbox;
}(React.Component);

ModalCheckbox.displayName = 'ModalCheckboxComponent';

ModalCheckbox.propTypes = {
  onClickHandler: PropTypes.func.isRequired,
  onLinkClickHandler: PropTypes.func.isRequired,
  checked: PropTypes.bool,
  helpUrl: PropTypes.string,
  titleClassName: PropTypes.string,
  inputClassName: PropTypes.string,
  name: PropTypes.string.isRequired
};

module.exports = ModalCheckbox;