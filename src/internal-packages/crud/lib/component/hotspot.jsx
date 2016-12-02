const React = require('react');
const Element = require('hadron-document').Element;

/**
 * The hotspot class name.
 */
const CLASS = 'hotspot';

/**
 * The button class name.
 */
const BUTTON_CLASS = 'btn btn-default btn-xs';

/**
 * The icon class name.
 */
const ICON = 'fa fa-plus';

/**
 * The add text.
 */
const ADD = 'ADD';

/**
 * Component for add element hotspot.
 */
class Hotspot extends React.Component {

  /**
   * The component constructor.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    this.state = { actionable: this.isActionable() };
    this.props.element.on(Element.Events.Edited, this.handleEdit.bind(this));
    this.props.element.on(Element.Events.Added, this.handleEdit.bind(this));
    this.props.element.on(Element.Events.Removed, this.handleEdit.bind(this));
  }

  /**
   * When clicking on a hotspot we append or remove on the parent.
   */
  handleClick() {
    this.props.element.next();
  }

  /**
   * Determines if the state needs to change to display the add button or not.
   */
  handleEdit() {
    if (this.state.actionable && !this.isActionable()) {
      this.setState({ actionable: false });
    } else if (!this.state.actionable && this.isActionable()) {
      this.setState({ actionable: true });
    }
  }

  /**
   * Determine if the hotspot is actionable.
   *
   * @returns {Boolean} If the hotspot is actionable.
   */
  isActionable() {
    const element = this.props.element;
    if (element.isRoot()) {
      const lastElement = element.elements.lastElement;
      return !(lastElement && lastElement.isBlank());
    }
    return !element.isBlank();
  }

  /**
   * Render the add button.
   *
   * @returns {React.Component} The add button.
   */
  renderButton() {
    if (this.state.actionable) {
      return (
        <span className={BUTTON_CLASS}>
          {ADD}
          <i className={ICON} />
        </span>
      );
    }
  }

  /**
   * Render the hotspot.
   *
   * @returns {Component} The hotspot component.
   */
  render() {
    return (
      <div className={CLASS} onClick={this.handleClick.bind(this)}>
        {this.renderButton()}
      </div>
    );
  }
}

Hotspot.displayName = 'Hotspot';

Hotspot.propTypes = {
  element: React.PropTypes.object.isRequired
};

module.exports = Hotspot;
