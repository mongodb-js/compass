'use strict';

const React = require('react');
const TypeChecker = require('hadron-component-registry').TypeChecker;
const Element = require('hadron-document').Element;
const EditableKey = require('./editable-key');
const EditableValue = require('./editable-value');

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
    this.state = { type: TypeChecker.type(this.element.currentValue) };

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
        <div className='line-number'></div>
        <div className='actions' onClick={this.handleRemove.bind(this)}>x</div>
        <EditableKey element={this.element} />
        :
        {this.editableValue()}
        <div className='types'>{this.state.type}</div>
      </li>
    );
  }

  editableValue() {
    if (this.element.elements) {
      return React.createElement('ol', {}, this.childElements());
    }
    return React.createElement(EditableValue, { element: this.element });
  }

  childElements() {
    return _.map(this.element.elements, (element) => {
      console.log(element);
      return React.createElement(
        EditableElement,
        { key: `${this.element.key}_${element.key}`, element: element }
      );
    });
  }

  /**
   * Handle an edit to the element.
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
    var style = `${PROPERTY_CLASS} ${this.state.type.toLowerCase()}`;
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
