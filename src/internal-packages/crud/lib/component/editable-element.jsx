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
 * The caret for expanding elements.
 */
const CARET = 'caret';

/**
 * The class for the document itself.
 */
const DOCUMENT_CLASS = 'editable-expandable-element-children';

/**
 * The header class for expandable elements.
 */
const HEADER_CLASS = 'editable-expandable-element-header';

/**
 * The expandable label class.
 */
const LABEL_CLASS = 'editable-expandable-element-header-label';

/**
 * The expanded class name.
 */
const EXPANDED = 'expanded';

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
    this.element.on(Element.Events.Converted, this.handleConvert.bind(this));
  }

  /**
   * Get the components for the elements.
   *
   * @returns {Array} The components.
   */
  elementComponents() {
    const components = [];
    let index = 0;
    for (const element of this.element.elements) {
      components.push(<EditableElement key={element.uuid} element={element} index={index} padding={this.props.padding + 16} />);
      index++;
    }
    return components;
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
   * Here to re-render the component when converted to array or object.
   */
  handleConvert() {
    this.setState({ expanded: true });
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
   * @param {String} base - The base style.
   *
   * @returns {String} The element style.
   */
  style(base) {
    let style = base;
    if (this.element.isAdded()) {
      style = style.concat(` ${base}-is-${ADDED}`);
    } else if (this.element.isEdited()) {
      style = style.concat(` ${base}-is-${EDITED}`);
    } else if (this.element.isRemoved()) {
      style = style.concat(` ${base}-is-${REMOVED}`);
    }
    if (this.state.expanded) {
      style = style.concat(` ${base}-is-${EXPANDED}`);
    }
    return style;
  }

  /**
  /**
   * Get the value component for the type.
   *
   * @param {String} type - The type.
   *
   * @returns {Component} The value component.
   */
  valueComponent(type) {
    return require(VALUE_MAPPINGS[type] || './non-editable-value');
  }

  /**
   * Get the revert or remove action.
   *
   * @returns {Component} The component.
   */
  renderAction() {
    if (this.element.isRevertable()) {
      return (<RevertAction element={this.element} />);
    } else if (this.element.isNotActionable()) {
      return (<NoAction element={this.element} />);
    }
    return (<RemoveAction element={this.element} />);
  }

  /**
   * Render a non-expandable element.
   *
   * @returns {Component} The component.
   */
  renderNonExpandable() {
    return (
      <li className={this.style('editable-element')} style={{ paddingLeft: `${this.props.padding}px` }}>
        {this.renderAction()}
        <div className="editable-element-line-number"></div>
        <EditableKey element={this.element} index={this.props.index} />
        :
        {this.renderValue()}
        <Hotspot key="editable-element-hotspot" element={this.element} />
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
    const props = { element: this.element };
    return React.createElement(this.valueComponent(this.element.currentType), props);
  }

  /**
   * Render an expandable element.
   *
   * @returns {Component} The component.
   */
  renderExpandable() {
    return (
      <li className={this.style('editable-expandable-element')}>
        <div className={this.style(HEADER_CLASS)} style={{ paddingLeft: `${this.props.padding}px` }}>
          {this.renderAction()}
          <div className="editable-element-line-number" onClick={this.toggleExpandable.bind(this)}></div>
          <div className="editable-expandable-element-header-toggle" onClick={this.toggleExpandable.bind(this)}></div>
          <EditableKey element={this.element} index={this.props.index} />
          :
          <div className={LABEL_CLASS} onClick={this.toggleExpandable.bind(this)}>
            {this.element.currentType}
          </div>
        </div>
        <ol className={this.style(DOCUMENT_CLASS)}>
          {this.elementComponents()}
        </ol>
      </li>
    );
  }

  /**
   * Render a single editable element.
   *
   * @returns {React.Component} The element component.
   */
  render() {
    return this.element.elements ? this.renderExpandable() : this.renderNonExpandable();
  }
}

EditableElement.displayName = 'EditableElement';

EditableElement.propTypes = {
  element: React.PropTypes.object.isRequired,
  index: React.PropTypes.number
};

module.exports = EditableElement;
