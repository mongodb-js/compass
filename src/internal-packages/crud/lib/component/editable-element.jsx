'use strict';

const React = require('react');
const Element = require('hadron-document').Element;
const EditableKey = require('./editable-key');
const EditableValue = require('./editable-value');
const RevertAction = require('./revert-action');
const RemoveAction = require('./remove-action');
const NoAction = require('./no-action');

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
 * The editing class constant.
 */
const EDITING = 'editing';

/**
 * The property class.
 */
const PROPERTY_CLASS = 'document-property';

/**
 * General editable element component.
 */
class EditableElement extends React.Component {

  /**
   * The component constructor.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    this.element = props.element;
    this.element.on(Element.Events.Edited, this.handleEdit.bind(this));
    this.element.on(Element.Events.Removed, this.handleRemove.bind(this));
    this.element.on(Element.Events.Reverted, this.handleRevert.bind(this));
  }

  /**
   * Render a single editable element.
   *
   * @returns {React.Component} The element component.
   */
  render() {
    return (
      <li className={this.style()}>
        <div className='line-number'></div>
        {this.action()}
        <EditableKey element={this.element} />
        :
        <EditableValue element={this.element} />
        <div className='types'>{this.element.currentType}</div>
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
    } else if (this.element.key === '_id') {
      return React.createElement(NoAction, { element: this.element });
    }
    return React.createElement(RemoveAction, { element: this.element });
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
    this.setState({});
  }

  /**
   * Here to re-render the component when an edit is reverted.
   */
  handleRevert() {
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
    return style;
  }
}

EditableElement.displayName = 'EditableElement';

module.exports = EditableElement;
