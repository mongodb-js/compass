'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var React = require('react');
var PropTypes = require('prop-types');

/**
 * An input field in a form in a modal.
 */

var ModalInput = function (_React$PureComponent) {
  _inherits(ModalInput, _React$PureComponent);

  function ModalInput() {
    _classCallCheck(this, ModalInput);

    return _possibleConstructorReturn(this, (ModalInput.__proto__ || Object.getPrototypeOf(ModalInput)).apply(this, arguments));
  }

  _createClass(ModalInput, [{
    key: 'render',


    /**
     * Render the input.
     *
     * @returns {React.Component} The react component.
     */
    value: function render() {
      return React.createElement(
        'div',
        { className: 'form-group' },
        React.createElement(
          'p',
          null,
          this.props.name
        ),
        React.createElement('input', {
          autoFocus: this.props.autoFocus,
          id: this.props.id,
          type: 'text',
          className: 'form-control',
          onChange: this.props.onChangeHandler,
          value: this.props.value })
      );
    }
  }]);

  return ModalInput;
}(React.PureComponent);

ModalInput.displayName = 'ModalInputComponent';

ModalInput.propTypes = {
  autoFocus: PropTypes.bool,
  onChangeHandler: PropTypes.func.isRequired,
  value: PropTypes.string,
  name: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired
};

ModalInput.defaultProps = {
  autoFocus: false
};

module.exports = ModalInput;