const React = require('react');

/**
 * The button constant.
 */
const BUTTON = 'button';

/**
 * Component for a button with an icon and text where the icon is animated.
 */
class AnimatedIconTextButton extends React.Component {

  /**
   * Instantiate the component.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    this.state = { animating: false };
  }
  /**
   * Fetch the state when the component mounts.
   */
  componentDidMount() {
    this.unsubscribeStopAnimation = this.props.stopAnimationListenable.listen(this.handleStopAnimation.bind(this));
  }

  /**
   * Unsibscribe from the document list store when unmounting.
   */
  componentWillUnmount() {
    this.unsubscribeStopAnimation();
  }

  /**
   * Handle the click of the button.
   */
  handleClick() {
    this.setState({ animating: true });
    this.props.clickHandler();
  }

  /**
   * Handles the stopping of the animation.
   */
  handleStopAnimation() {
    this.setState({ animating: false });
  }

  /**
   * Render the icon based on the animation state.
   *
   * @returns {React.Component} The icon component.
   */
  renderIcon() {
    const className = this.state.animating ? this.props.animatingIconClassName : this.props.iconClassName;
    return React.createElement('i', { className: className, 'aria-hidden': true });
  }

  /**
   * Render the button.
   *
   * @returns {Component} The button component.
   */
  render() {
    return React.createElement(
      'button',
      {
        type: BUTTON,
        'data-test-id': this.props.dataTestId,
        className: this.props.className,
        onClick: this.handleClick.bind(this) },
      this.renderIcon(),
      this.props.text
    );
  }
}

AnimatedIconTextButton.displayName = 'AnimatedIconTextButton';

AnimatedIconTextButton.propTypes = {
  text: React.PropTypes.string,
  clickHandler: React.PropTypes.func.isRequired,
  className: React.PropTypes.string,
  iconClassName: React.PropTypes.string.isRequired,
  animatingIconClassName: React.PropTypes.string.isRequired,
  dataTestId: React.PropTypes.string,
  stopAnimationListenable: React.PropTypes.any.isRequired
};

module.exports = AnimatedIconTextButton;