'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var React = require('react');
var PropTypes = require('prop-types');

var _require = require('react-bootstrap'),
    Button = _require.Button,
    ButtonGroup = _require.ButtonGroup;

/**
 * Represents a component that provides buttons to switch between
 * view modes.
 */


var ViewSwitcher = function (_React$Component) {
  _inherits(ViewSwitcher, _React$Component);

  function ViewSwitcher() {
    _classCallCheck(this, ViewSwitcher);

    return _possibleConstructorReturn(this, (ViewSwitcher.__proto__ || Object.getPrototypeOf(ViewSwitcher)).apply(this, arguments));
  }

  _createClass(ViewSwitcher, [{
    key: 'buttonFactory',


    /**
     * return array of button components based on buttonLabels and activeButton
     *
     * @return {React.Fragment}  array of buttons
     */
    value: function buttonFactory() {
      var _this2 = this;

      return this.props.buttonLabels.map(function (label, i) {
        var active = _this2.props.activeButton === label;
        var dataTestId = _this2.props.dataTestId + '-' + label.toLowerCase().replace(/ /g, '-');
        return React.createElement(
          Button,
          {
            key: label,
            active: active,
            'data-test-id': dataTestId,
            disabled: _this2.props.disabled,
            onClick: _this2.props.onClick.bind(_this2, label),
            bsSize: 'xsmall' },
          _this2.renderIcon(i),
          label
        );
      });
    }
  }, {
    key: 'renderIcon',
    value: function renderIcon(i) {
      if (this.props.iconClassNames[i]) {
        return React.createElement('i', { className: this.props.iconClassNames[i], 'aria-hidden': true });
      }
    }

    /**
     * Render view switcher component.
     *
     * @returns {React.Component} The component.
     */

  }, {
    key: 'render',
    value: function render() {
      var buttons = this.buttonFactory();
      return React.createElement(
        'div',
        { className: 'view-switcher' },
        React.createElement(
          'span',
          { className: 'view-switcher-label' },
          this.props.label
        ),
        React.createElement(
          ButtonGroup,
          null,
          buttons
        )
      );
    }
  }]);

  return ViewSwitcher;
}(React.Component);

ViewSwitcher.propTypes = {
  label: PropTypes.string,
  buttonLabels: PropTypes.arrayOf(PropTypes.string).isRequired,
  activeButton: PropTypes.string,
  disabled: PropTypes.bool,
  dataTestId: PropTypes.string,
  onClick: PropTypes.func,
  iconClassNames: PropTypes.arrayOf(PropTypes.string)
};

ViewSwitcher.defaultProps = {
  iconClassNames: []
};

ViewSwitcher.displayName = 'ViewSwitcher';

module.exports = ViewSwitcher;