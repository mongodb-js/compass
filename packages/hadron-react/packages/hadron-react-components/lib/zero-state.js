'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var React = require('react');
var PropTypes = require('prop-types');

/**
 * Base component CSS class.
 */
var BASE = 'zero-state';

/**
 * Component for a basic zero state.
 */

var ZeroState = function (_React$Component) {
  _inherits(ZeroState, _React$Component);

  function ZeroState() {
    _classCallCheck(this, ZeroState);

    return _possibleConstructorReturn(this, (ZeroState.__proto__ || Object.getPrototypeOf(ZeroState)).apply(this, arguments));
  }

  _createClass(ZeroState, [{
    key: 'render',

    /**
     * Render the zero state.
     *
     * @returns {React.Component} The component.
     */
    value: function render() {
      return React.createElement(
        'div',
        { className: '' + BASE },
        React.createElement(
          'p',
          { className: BASE + '-header' },
          this.props.header
        ),
        React.createElement(
          'p',
          { className: BASE + '-subheader' },
          this.props.subtext
        ),
        React.createElement(
          'div',
          { className: BASE + '-body' },
          this.props.children
        )
      );
    }
  }]);

  return ZeroState;
}(React.Component);

ZeroState.displayName = 'ZeroState';

ZeroState.propTypes = {
  header: PropTypes.string.isRequired,
  subtext: PropTypes.string.isRequired,
  children: PropTypes.node
};

module.exports = ZeroState;