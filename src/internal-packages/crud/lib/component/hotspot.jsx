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
const INSERT_AFTER_ICON = 'fa fa-level-down fa-rotate-90';

/**
 * Append child icon.
 */
const APPEND_CHILD_ICON = 'fa fa-plus-square-o';

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
  handleInsertAfterClick() {
    this.props.element.next();
  }

  /**
   * When clicking on an expandable element to append a child.
   */
  handleAppendChildClick() {
    this.props.element.insertPlaceholder();
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
   * Render the append child button.
   *
   * @returns {React.Component} The button.
   */
  renderAppendChildButton() {
    if (this.state.actionable && this.props.expandable) {
      return (
        <span className={BUTTON_CLASS} onClick={this.handleAppendChildClick.bind(this)}>
          ADD CHILD
          <i className={APPEND_CHILD_ICON} />
        </span>
      );
    }
  }

  /**
   * Render the insert after button.
   *
   * @returns {React.Component} The button.
   */
  renderInsertAfterButton() {
    if (this.state.actionable) {
      return (
        <span className={BUTTON_CLASS} onClick={this.handleInsertAfterClick.bind(this)}>
          ADD FIELD
          <i className={INSERT_AFTER_ICON} />
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
      <div className={CLASS}>
        {this.renderAppendChildButton()}
        {this.renderInsertAfterButton()}
      </div>
    );
  }
}

Hotspot.displayName = 'Hotspot';

Hotspot.propTypes = {
  element: React.PropTypes.object.isRequired,
  expandable: React.PropTypes.bool
};

module.exports = Hotspot;
