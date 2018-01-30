'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var React = require('react');
var PropTypes = require('prop-types');
var Panel = require('react-bootstrap').Panel;

/**
 * Component for the status message.
 */

var ModalStatusMessage = function (_React$Component) {
  _inherits(ModalStatusMessage, _React$Component);

  function ModalStatusMessage() {
    _classCallCheck(this, ModalStatusMessage);

    return _possibleConstructorReturn(this, (ModalStatusMessage.__proto__ || Object.getPrototypeOf(ModalStatusMessage)).apply(this, arguments));
  }

  _createClass(ModalStatusMessage, [{
    key: 'render',


    /**
     * Render the status message.
     *
     * @returns {React.Component} The status message component.
     */
    value: function render() {
      // prefix for class names for css styling
      var classPrefix = 'modal-status-' + this.props.type;
      return React.createElement(
        Panel,
        { className: classPrefix },
        React.createElement(
          'div',
          { className: 'row' },
          React.createElement(
            'div',
            { className: 'col-md-1' },
            React.createElement('i', {
              className: 'fa fa-' + this.props.icon + ' ' + classPrefix + '-icon',
              'aria-hidden': 'true' })
          ),
          React.createElement(
            'div',
            { className: 'col-md-11' },
            React.createElement(
              'p',
              {
                className: classPrefix + '-message', 'data-test-id': 'modal-message' },
              this.props.message
            )
          )
        )
      );
    }
  }]);

  return ModalStatusMessage;
}(React.Component);

ModalStatusMessage.displayName = 'ModalStatusMessage';

ModalStatusMessage.propTypes = {
  icon: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired
};

module.exports = ModalStatusMessage;