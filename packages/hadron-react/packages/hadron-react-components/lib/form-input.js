'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var React = require('react');
var ReactTooltip = require('react-tooltip');
var PropTypes = require('prop-types');

/**
 * Represents an input field within a form.
 */

var FormInput = function (_React$Component) {
  _inherits(FormInput, _React$Component);

  function FormInput() {
    _classCallCheck(this, FormInput);

    return _possibleConstructorReturn(this, (FormInput.__proto__ || Object.getPrototypeOf(FormInput)).apply(this, arguments));
  }

  _createClass(FormInput, [{
    key: 'getClassName',


    /**
     * Get the class name for the input wrapper.
     *
     * @returns {String} The class name.
     */
    value: function getClassName() {
      var className = 'form-item';
      if (this.props.error) {
        return className + ' form-item-has-error';
      }
      return className;
    }

    /**
     * Get the error id for the tooltip.
     *
     * @returns {String} The error id.
     */

  }, {
    key: 'getErrorId',
    value: function getErrorId() {
      return 'form-error-tooltip-' + this.props.name;
    }

    /**
     * Render the info sprinkle if a link handler was provided.
     *
     * @returns {React.Component} The info sprinkle.
     */

  }, {
    key: 'renderInfoSprinkle',
    value: function renderInfoSprinkle() {
      if (this.props.linkHandler) {
        return React.createElement('i', { className: 'help', onClick: this.props.linkHandler });
      }
    }

    /**
     * Render the error icon.
     *
     * @returns {React.Component} The error icon.
     */

  }, {
    key: 'renderError',
    value: function renderError() {
      if (this.props.error) {
        return React.createElement('i', { className: 'fa fa-exclamation-circle', 'aria-hidden': 'true' });
      }
    }

    /**
     * Render the error tooltip.
     *
     * @returns {React.Component} The error tooltip.
     */

  }, {
    key: 'renderErrorTooltip',
    value: function renderErrorTooltip() {
      if (this.props.error) {
        return React.createElement(ReactTooltip, { id: this.getErrorId() });
      }
    }

    /**
     * Render the input field.
     *
     * @returns {React.Component} The input field.
     */

  }, {
    key: 'render',
    value: function render() {
      var tooltipOptions = this.props.error ? {
        'data-for': this.getErrorId(),
        'data-effect': 'solid',
        'data-place': 'bottom',
        'data-offset': "{'bottom': -2}",
        'data-tip': this.props.error,
        'data-type': 'error'
      } : {};
      return React.createElement(
        'div',
        { className: this.getClassName() },
        React.createElement(
          'label',
          null,
          React.createElement(
            'span',
            { className: 'form-item-label' },
            this.renderError(),
            this.props.label
          ),
          this.renderInfoSprinkle()
        ),
        React.createElement('input', _extends({
          name: this.props.name,
          placeholder: this.props.placeholder,
          onChange: this.props.changeHandler,
          onBlur: this.props.blurHandler,
          value: this.props.value,
          className: 'form-control',
          type: this.props.type || 'text'
        }, tooltipOptions)),
        this.renderErrorTooltip()
      );
    }
  }]);

  return FormInput;
}(React.Component);

FormInput.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  changeHandler: PropTypes.func.isRequired,
  blurHandler: PropTypes.func,
  linkHandler: PropTypes.func,
  placeholder: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  type: PropTypes.string,
  error: PropTypes.string
};

FormInput.displayName = 'FormInput';

module.exports = FormInput;