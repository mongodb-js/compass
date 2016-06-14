'use strict';

const React = require('react');
const Element = require('hadron-document').Element;
const EditableKey = require('./editable-key');
const EditableElement = require('./editable-element');
const RevertAction = require('./revert-action');
const RemoveAction = require('./remove-action');

/**
 * The added constant.
 */
const ADDED = 'added';

/**
 * The edited constant.
 */
const EDITED = 'edited';

/**
 * The removed constant.
 */
const REMOVED = 'removed';

/**
 * The class for the document itself.
 */
const DOCUMENT_CLASS = 'document-property-body';

/**
 * The header class for expandable elements.
 */
const HEADER_CLASS = 'document-property-header';

/**
 * The caret for expanding elements.
 */
const CARET = 'caret';

/**
 * The expanded class name.
 */
const EXPANDED = 'expanded';

/**
 * The property class.
 */
const PROPERTY_CLASS = 'document-property';

/**
 * The expandable label class.
 */
const LABEL_CLASS = 'document-property-type-label';

/**
 * General editable expandable element component.
 */
class EditableExpandableElement extends React.Component {

  /**
   * The component constructor.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    this.element = props.element;
    this.state = { expanded: false };
    this.element.on(Element.Events.Edited, this.handleEdit.bind(this));
  }

  /**
   * Render a single editable element.
   *
   * @returns {React.Component} The element component.
   */
  render() {
    return (
      <li className={this.style()}>
        <div className={HEADER_CLASS} onClick={this.toggleExpandable.bind(this)}>
          <div className='line-number'></div>
          {this.action()}
          <div className={CARET}></div>
          <EditableKey element={this.element} />
          :
          <div className={LABEL_CLASS}>
            {this.element.currentType}
          </div>
        </div>
        <ol className={DOCUMENT_CLASS}>
          {this.elementComponents()}
        </ol>
      </li>
    );
  }

  /**
   * Get the revert or remove action.
   *
   * @returns {Component} The component.
   */
  action() {
    if (this.element.isEdited() || this.element.isRemoved()) {
      return React.createElement(RevertAction, { element: this.element });
    }
    return React.createElement(RemoveAction, { element: this.element });
  }

  /**
   * Get the components for the elements.
   *
   * @returns {Array} The components.
   */
  elementComponents() {
    return _.map(this.element.elements, (element) => {
      return React.createElement(
        EditableElement,
        { key: `${this.element.key}_${element.key}`, element: element }
      );
    });
  }

  /**
   * Toggles the expandable aspect of the element.
   */
  toggleExpandable() {
    this.setState({ expanded: !this.state.expanded });
  }

  /**
   * Here to re-render the component when a key or value is edited.
   */
  handleEdit() {
    this.setState({});
  }

  /**
   * Handle removal of an element.
   */
  handleRemove() {
    this.element.remove();
    this.setState({});
  }

  /**
   * Get the style for the element component.
   *
   * @returns {String} The element style.
   */
  style() {
    var style = `${PROPERTY_CLASS} ${this.element.currentType.toLowerCase()}`;
    if (this.element.isAdded()) {
      style = style.concat(` ${ADDED}`);
    }
    if (this.element.isEdited()) {
      style = style.concat(` ${EDITED}`);
    }
    if (this.element.isRemoved()) {
      style = style.concat(` ${REMOVED}`);
    }
    if (this.state.expanded) {
      style = style.concat(` ${EXPANDED}`);
    }
    return style;
  }
}

EditableExpandableElement.displayName = 'EditableExpandableElement';

module.exports = EditableExpandableElement;
