'use strict';

const React = require('react');
const Element = require('hadron-document').Element;
const EditableKey = require('./editable-key');
const EditableValue = require('./editable-value');
const RevertAction = require('./revert-action');
const RemoveAction = require('./remove-action');
const NoAction = require('./no-action');
const Types = require('./types');

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
 * The caret for expanding elements.
 */
const CARET = 'caret';

/**
 * The class for the document itself.
 */
const DOCUMENT_CLASS = 'document-property-body';

/**
 * The header class for expandable elements.
 */
const HEADER_CLASS = 'document-property-header expandable';

/**
 * The property class.
 */
const PROPERTY_CLASS = 'document-property';

/**
 * The expandable label class.
 */
const LABEL_CLASS = 'document-property-type-label';

/**
 * The expanded class name.
 */
const EXPANDED = 'expanded';

const NON_EXPANDABLE = 'non-expandable';

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
    this.state = { expanded: false };
    this.element.on(Element.Events.Added, this.handleAdd.bind(this));
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
    return this.element.elements ? this.renderExpandable() : this.renderNonExpandable();
  }

  renderNonExpandable() {
    return (
      <li className={this.style()}>
        <div className='line-number'></div>
        {this.action()}
        <EditableKey element={this.element} />
        :
        <EditableValue element={this.element} />
        <Types element={this.element} />
      </li>
    );
  }

  renderExpandable() {
    return (
      <li className={this.style()}>
        <div className={HEADER_CLASS}>
          <div className='line-number' onClick={this.toggleExpandable.bind(this)}></div>
          {this.action()}
          <div className={CARET} onClick={this.toggleExpandable.bind(this)}></div>
          <EditableKey element={this.element} />
          :
          <div className={LABEL_CLASS} onClick={this.toggleExpandable.bind(this)}>
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
   * Get the components for the elements.
   *
   * @returns {Array} The components.
   */
  elementComponents() {
    return _.map(this.element.elements, (element) => {
      return React.createElement(EditableElement, { key: element.uuid, element: element });
    });
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

  handleAdd() {
    this.setState({ expanded: true });
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
   * Toggles the expandable aspect of the element.
   */
  toggleExpandable() {
    this.setState({ expanded: !this.state.expanded });
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
    } else if (this.element.isEdited()) {
      style = style.concat(` ${EDITED}`);
    } else if (this.element.isRemoved()) {
      style = style.concat(` ${REMOVED}`);
    }
    if (!this.element.elements) {
      style = style.concat(` ${NON_EXPANDABLE}`);
    }
    if (this.state.expanded) {
      style = style.concat(` ${EXPANDED}`);
    }
    return style;
  }
}

EditableElement.displayName = 'EditableElement';

module.exports = EditableElement;
