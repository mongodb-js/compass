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
 * Component for a button with an icon and text where the icon is animated.
 */

var AnimatedIconTextButton = function (_React$Component) {
  _inherits(AnimatedIconTextButton, _React$Component);

  /**
   * Instantiate the component.
   *
   * @param {Object} props - The properties.
   */
  function AnimatedIconTextButton(props) {
    _classCallCheck(this, AnimatedIconTextButton);

    var _this = _possibleConstructorReturn(this, (AnimatedIconTextButton.__proto__ || Object.getPrototypeOf(AnimatedIconTextButton)).call(this, props));

    _this.state = { animating: false };

    return _this;
  }
  /**
   * Fetch the state when the component mounts.
   */


  _createClass(AnimatedIconTextButton, [{
    key: 'componentDidMount',
    value: function componentDidMount() {
      this.unsubscribeStopAnimation = this.props.stopAnimationListenable.listen(this.handleStopAnimation.bind(this));
    }

    /**
     * Unsibscribe from the document list store when unmounting.
     */

  }, {
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      this.unsubscribeStopAnimation();
    }

    /**
     * Handle the click of the button.
     */

  }, {
    key: 'handleClick',
    value: function handleClick() {
      this.setState({ animating: true });
      this.props.clickHandler();
    }

    /**
     * Handles the stopping of the animation.
     */

  }, {
    key: 'handleStopAnimation',
    value: function handleStopAnimation() {
      this.setState({ animating: false });
    }

    /**
     * Render the icon based on the animation state.
     *
     * @returns {React.Component} The icon component.
     */

  }, {
    key: 'renderIcon',
    value: function renderIcon() {
      var className = this.state.animating ? this.props.animatingIconClassName : this.props.iconClassName;
      return React.createElement('i', { className: className, 'aria-hidden': true });
    }

    /**
     * Render the button.
     *
     * @returns {Component} The button component.
     */

  }, {
    key: 'render',
    value: function render() {
      return React.createElement(
        'button',
        {
          type: BUTTON,
          'data-test-id': this.props.dataTestId,
          className: this.props.className,
          onClick: this.handleClick.bind(this),
          disabled: this.props.disabled },
        this.renderIcon(),
        this.props.text
      );
    }
  }]);

  return AnimatedIconTextButton;
}(React.Component);

AnimatedIconTextButton.displayName = 'AnimatedIconTextButton';

AnimatedIconTextButton.propTypes = {
  text: PropTypes.string,
  clickHandler: PropTypes.func.isRequired,
  className: PropTypes.string,
  iconClassName: PropTypes.string.isRequired,
  animatingIconClassName: PropTypes.string.isRequired,
  dataTestId: PropTypes.string,
  stopAnimationListenable: PropTypes.any.isRequired,
  disabled: PropTypes.bool
};

module.exports = AnimatedIconTextButton;