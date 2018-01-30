'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var React = require('react');
var PropTypes = require('prop-types');

/**
 * An info sprinkle which can be clicked to perform the work in the
 * onClickHandler. The onClickHandler receives the helpLink argument.
 */

var InfoSprinkle = function (_React$Component) {
  _inherits(InfoSprinkle, _React$Component);

  function InfoSprinkle() {
    _classCallCheck(this, InfoSprinkle);

    return _possibleConstructorReturn(this, (InfoSprinkle.__proto__ || Object.getPrototypeOf(InfoSprinkle)).apply(this, arguments));
  }

  _createClass(InfoSprinkle, [{
    key: 'render',


    /**
     * Render the input.
     *
     * @returns {React.Component} The react component.
     */
    value: function render() {
      return React.createElement('i', { className: 'info-sprinkle',
        onClick: this.props.onClickHandler.bind(this, this.props.helpLink)
      });
    }
  }]);

  return InfoSprinkle;
}(React.Component);

InfoSprinkle.displayName = 'InfoSprinkle';

InfoSprinkle.propTypes = {
  onClickHandler: PropTypes.func.isRequired, // e.g. require('electron').shell.openExternal
  helpLink: PropTypes.string.isRequired
};

module.exports = InfoSprinkle;