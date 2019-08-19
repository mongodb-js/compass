'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var React = require('react');
var PropTypes = require('prop-types');

var _require = require('react-bootstrap'),
    DropdownButton = _require.DropdownButton,
    MenuItem = _require.MenuItem;

/**
 * An OptionSelector component is composed of a few components:
 *
 *  1. A subset of the options available in a React-Bootstrap dropdown:
 *     @see https://react-bootstrap.github.io/components.html#btn-dropdowns-props-dropdown-button
 *  2. A label for the dropdown
 *  3. An ordered object of key-value pairs, which populate the
 *     MenuItem list when the dropdown is activated.
 */


var OptionSelector = function (_React$Component) {
  _inherits(OptionSelector, _React$Component);

  function OptionSelector() {
    _classCallCheck(this, OptionSelector);

    return _possibleConstructorReturn(this, (OptionSelector.__proto__ || Object.getPrototypeOf(OptionSelector)).apply(this, arguments));
  }

  _createClass(OptionSelector, [{
    key: 'render',


    /**
     * Renders the Option Selector component.
     *
     * @returns {React.Component} The component.
     */
    value: function render() {
      var htmlLabel = this.constructor.renderLabel(this.props.label, this.props.id);

      var menuItems = [];
      for (var key in this.props.options) {
        if (this.props.options.hasOwnProperty(key)) {
          var label = this.props.options[key];
          menuItems.push(React.createElement(
            MenuItem,
            { key: key, eventKey: key, href: '#' },
            label
          ));
        }
      }

      return React.createElement(
        'div',
        { className: 'option-selector' },
        htmlLabel,
        React.createElement(
          DropdownButton,
          {
            bsSize: this.props.bsSize,
            className: this.props.className,
            id: this.props.id,
            onSelect: this.props.onSelect,
            title: this.props.title,
            disabled: this.props.disabled },
          menuItems
        )
      );
    }
  }], [{
    key: 'renderLabel',
    value: function renderLabel(label, id) {
      return label ? React.createElement(
        'label',
        { className: 'option-selector-label', htmlFor: id },
        label
      ) : null;
    }
  }]);

  return OptionSelector;
}(React.Component);

OptionSelector.propTypes = {
  id: PropTypes.string.isRequired,
  className: PropTypes.string,
  bsSize: PropTypes.string,
  options: PropTypes.object.isRequired,
  label: PropTypes.string,
  // for titles with glyphicons, this has to accept string or object
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  onSelect: PropTypes.func,
  disabled: PropTypes.bool
};

OptionSelector.defaultProps = {
  label: '',
  title: 'Select an option',
  onSelect: function onSelect() {},
  disabled: false
};

OptionSelector.displayName = 'OptionSelector';

module.exports = OptionSelector;