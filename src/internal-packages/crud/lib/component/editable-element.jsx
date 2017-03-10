const React = require('react');
const getComponent = require('hadron-react-bson');
const { Element } = require('hadron-document');
const EditableKey = require('./editable-key');
const EditableValue = require('./editable-value');
const ElementAction = require('./element-action');
const LineNumber = require('./line-number');
const Types = require('./types');

/**
 * The BEM base style name for the element.
 */
const BEM_BASE = 'editable-element';

/**
 * The BEM base style name for the expandable element.
 */
const BEM_EXP_BASE = 'editable-expandable-element';

/**
 * The added constant.
 */
const ADDED = 'is-added';

/**
 * The edited constant.
 */
const EDITED = 'is-edited';

/**
 * The editing constant.
 */
const EDITING = 'is-editing';

/**
 * The removed constant.
 */
const REMOVED = 'is-removed';

/**
 * The expanded class name.
 */
const EXPANDED = 'is-expanded';

/**
 * The class for the document itself.
 */
const CHILDREN = `${BEM_EXP_BASE}-children`;

/**
 * The header class for expandable elements.
 */
const HEADER = `${BEM_EXP_BASE}-header`;

/**
 * The expandable label class.
 */
const HEADER_LABEL = `${HEADER}-label`;

/**
 * The separator style.
 */
const SEPARATOR = 'element-separator';

/**
 * The field class.
 */
const FIELD_CLASS = 'editable-element-field';

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
    this.element.on(Element.Events.Added, this.handleExpand.bind(this));
    this.element.on(Element.Events.Converted, this.handleExpand.bind(this));
    this.element.on(Element.Events.Edited, this.handleChange.bind(this));
    this.element.on(Element.Events.Removed, this.handleChange.bind(this));
    this.element.on(Element.Events.Reverted, this.handleChange.bind(this));
    this.state = { expanded: this.props.expandAll, expandAll: this.props.expandAll };
  }

  /**
   * Set the state if the expand all prop changes.
   *
   * @param {Object} nextProps - The next properties.
   */
  componentWillReceiveProps(nextProps) {
    if (nextProps.expandAll !== this.state.expandAll) {
      this.setState({ expanded: nextProps.expandAll, expandAll: nextProps.expandAll });
    }
  }

  /**
   * Expand the element.
   */
  handleExpand() {
    this.setState({ expanded: true });
  }

  /**
   * Here to re-render the component when a change is made.
   */
  handleChange() {
    this.setState({});
  }

  /**
   * Toggles the expandable aspect of the element.
   */
  toggleExpandable() {
    this.setState({ expanded: !this.state.expanded });
  }

  /**
   * Get the inline style for the element.
   *
   * @returns {Object} The inline style object.
   */
  inlineStyle() {
    return { paddingLeft: `${this.props.indent}px` };
  }

  /**
   * Get the inline style for the toggle.
   *
   * @returns {Object} The inline style for the toggle.
   */
  inlineToggleStyle() {
    return { left: `${this.props.indent + 48}px` };
  }

  /**
   * Get the style for the element component.
   *
   * @param {String} base - The base style.
   *
   * @returns {String} The element style.
   */
  style(base = BEM_BASE) {
    let style = base;
    if (this.props.editing) {
      style = style.concat(` ${base}-${EDITING}`);
      if (this.element.isAdded()) {
        style = style.concat(` ${base}-${ADDED}`);
      } else if (this.element.isEdited()) {
        style = style.concat(` ${base}-${EDITED}`);
      } else if (this.element.isRemoved()) {
        style = style.concat(` ${base}-${REMOVED}`);
      }
    }
    if (this.state.expanded) {
      style = style.concat(` ${base}-${EXPANDED}`);
    }
    return style;
  }

  /**
   * Get the components for the elements.
   *
   * @returns {Array} The components.
   */
  renderChildren() {
    const components = [];
    let index = 0;
    for (const element of this.element.elements) {
      components.push((
        <EditableElement
          key={element.uuid}
          element={element}
          index={index}
          indent={this.props.indent + 16}
          editing={this.props.editing}
          expandAll={this.props.expandAll} />
      ));
      index++;
    }
    return components;
  }

  /**
   * Render the action column.
   *
   * @returns {React.Component} The component.
   */
  renderAction() {
    if (this.props.editing) {
      return (<ElementAction element={this.element} />);
    }
  }

  /**
   * Render the line number column.
   *
   * @returns {React.Component} The component.
   */
  renderLineNumber() {
    if (this.props.editing) {
      return (<LineNumber element={this.element} />);
    }
  }

  /**
   * Render the separator column.
   *
   * @returns {React.Component} The component.
   */
  renderSeparator() {
    return (<span className={SEPARATOR}>:</span>);
  }

  /**
   * Render the types column.
   *
   * @returns {React.Component} The component.
   */
  renderTypes() {
    if (this.props.editing) {
      return (<Types element={this.element} />);
    }
  }

  /**
   * Render the key column.
   *
   * @returns {React.Component} The component.
   */
  renderKey() {
    if (this.props.editing && this.element.currentKey !== '_id') {
      return (<EditableKey element={this.element} index={this.props.index} />);
    }
    return (
      <div className={FIELD_CLASS}>
        {this.element.parent.currentType === 'Array' ? this.props.index : this.element.currentKey}
      </div>
    );
  }

  /**
   * Render the toggle column.
   *
   * @returns {Component} The component.
   */
  renderToggle() {
    const HEADER_TOGGLE = this.state.expanded ? 'fa fa-angle-down' : 'fa fa-angle-right';

    return (
      <div
        className={`editable-element-expand-button ${HEADER_TOGGLE}`}
        style={this.inlineToggleStyle()}
        onClick={this.toggleExpandable.bind(this)}>
      </div>
    );
  }

  /**
   * Render the expanable label column.
   *
   * @returns {Component} The component.
   */
  renderLabel() {
    return (
      <div className={HEADER_LABEL} onClick={this.toggleExpandable.bind(this)}>
        {this.element.currentType}
      </div>
    );
  }

  /**
   * Render the value column.
   *
   * @todo: Durran: Editing or not?
   *
   * @returns {Component} The component.
   */
  renderValue() {
    if (this.props.editing && this.element.isValueEditable()) {
      return (<EditableValue element={this.element} />);
    }
    const component = getComponent(this.element.currentType);
    return React.createElement(
      component,
      { type: this.element.currentType, value: this.element.currentValue }
    );
  }

  /**
   * Render a non-expandable element.
   *
   * @returns {Component} The component.
   */
  renderNonExpandable() {
    return (
      <li className={this.style()} style={this.inlineStyle()}>
        {this.renderAction()}
        {this.renderLineNumber()}
        {this.renderKey()}
        {this.renderSeparator()}
        {this.renderValue()}
        {this.renderTypes()}
      </li>
    );
  }

  /**
   * Render an expandable element.
   *
   * @returns {React.Component} The component.
   */
  renderExpandable() {
    return (
      <li className={this.style(BEM_EXP_BASE)}>
        <div className={this.style(HEADER)} style={this.inlineStyle()}>
          {this.renderAction()}
          {this.renderLineNumber()}
          {this.renderToggle()}
          {this.renderKey()}
          {this.renderSeparator()}
          {this.renderLabel()}
        </div>
        <ol className={this.style(CHILDREN)}>
          {this.renderChildren()}
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
  editing: React.PropTypes.bool,
  element: React.PropTypes.object.isRequired,
  index: React.PropTypes.number,
  indent: React.PropTypes.number,
  expandAll: React.PropTypes.bool
};

module.exports = EditableElement;
