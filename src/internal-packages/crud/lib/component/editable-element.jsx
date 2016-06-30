'use strict';

const React = require('react');
const Element = require('hadron-document').Element;
const EditableKey = require('./editable-key');
const EditableValue = require('./editable-value');
const RevertAction = require('./revert-action');
const RemoveAction = require('./remove-action');
const NoAction = require('./no-action');
const Types = require('./types');
const Hotspot = require('./hotspot');

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

/**
 * The non-expandable class.
 */
const NON_EXPANDABLE = 'non-expandable';

/**
 * Mappings for non editable value components.
 */
const VALUE_MAPPINGS = {
  'Binary': './binary-value',
  'MinKey': './min-key-value',
  'MaxKey': './max-key-value',
  'Code': './code-value',
  'Timestamp': './timestamp-value',
  'ObjectID': './objectid-value'
};

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

  /**
   * Render a non-expandable element.
   *
   * @returns {Component} The component.
   */
  renderNonExpandable() {
    return (
      <li className={this.style()}>
        <div className='line-number'></div>
        {this.renderAction()}
        <EditableKey element={this.element} />
        :
        {this.renderValue()}
        <Hotspot key='hotspot' element={this.element} />
        <Types element={this.element} />
      </li>
    );
  }

  /**
   * Render the value for the component.
   *
   * @returns {Component} The value component.
   */
  renderValue() {
    if (this.element.isValueEditable()) {
      return (<EditableValue element={this.element} />);
    }
    var props = { element: this.element };
    return React.createElement(this.valueComponent(this.element.currentType), props);
  }

  /**
   * Render an expandable element.
   *
   * @returns {Component} The component.
   */
  renderExpandable() {
    return (
      <li className={this.style()}>
        <div className={HEADER_CLASS}>
          <div className='line-number' onClick={this.toggleExpandable.bind(this)}></div>
          {this.renderAction()}
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
    var components = _.map(this.element.elements, (element) => {
      return (<EditableElement key={element.uuid} element={element} />);
    });
    // var lastComponent = components[components.length - 1];
    // var lastElement = lastComponent ? lastComponent.props.element : null;
    // components.push(<Hotspot key='hotspot' doc={this.element} element={lastElement} />);
    return components;
  }

  /**
   * Get the revert or remove action.
   *
   * @returns {Component} The component.
   */
  renderAction() {
    if (this.element.isEdited() || this.element.isRemoved()) {
      return (<RevertAction element={this.element} />);
    } else if (this.element.key === '_id') {
      return (<NoAction element={this.element} />);
    }
    return (<RemoveAction element={this.element} />);
  }

  /**
   * Handle the addition of an element.
   */
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

  /**
   * Get the value component for the type.
   *
   * @returns {Component} The value component.
   */
  valueComponent(type) {
    return require(VALUE_MAPPINGS[type] || './non-editable-value');
  }
}

EditableElement.displayName = 'EditableElement';

module.exports = EditableElement;
