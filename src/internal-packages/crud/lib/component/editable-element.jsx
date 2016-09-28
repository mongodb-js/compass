const React = require('react');
const Element = require('hadron-document').Element;
const EditableKey = require('./editable-key');
const ElementValue = require('./element-value');
const ElementAction = require('./element-action');
const LineNumber = require('./line-number');
const Types = require('./types');
const Hotspot = require('./hotspot');

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
 * The carat for toggling expansion class.
 */
const HEADER_TOGGLE = `${HEADER}-toggle`;

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
    this.element.on(Element.Events.Added, this.expand.bind(this));
    this.element.on(Element.Events.Converted, this.expand.bind(this));
    this.element.on(Element.Events.Edited, this.handleChange.bind(this));
    this.element.on(Element.Events.Removed, this.handleChange.bind(this));
    this.element.on(Element.Events.Reverted, this.handleChange.bind(this));
    this.state = { expanded: false };
  }

  /**
   * Expand the element.
   */
  expand() {
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
   * Get the style for the element component.
   *
   * @param {String} base - The base style.
   *
   * @returns {String} The element style.
   */
  style(base = BEM_BASE) {
    let style = base;
    if (this.element.isAdded()) {
      style = style.concat(` ${base}-${ADDED}`);
    } else if (this.element.isEdited()) {
      style = style.concat(` ${base}-${EDITED}`);
    } else if (this.element.isRemoved()) {
      style = style.concat(` ${base}-${REMOVED}`);
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
      components.push(<EditableElement key={element.uuid} element={element} index={index} indent={this.props.indent + 16}/>);
      index++;
    }
    return components;
  }

  /**
   * Render a non-expandable element.
   *
   * @returns {Component} The component.
   */
  renderNonExpandable() {
    return (
      <li className={this.style()} style={{ paddingLeft: `${this.props.indent}px` }}>
        <ElementAction element={this.element} />
        <LineNumber />
        <EditableKey element={this.element} index={this.props.index} />
        <span className="element-separator">:</span>
        <ElementValue element={this.element} />
        <Hotspot key="editable-element-hotspot" element={this.element} />
        <Types element={this.element} />
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
          <ElementAction element={this.element} />
          <LineNumber />
          <div className={HEADER_TOGGLE} onClick={this.toggleExpandable.bind(this)}></div>
          <EditableKey element={this.element} index={this.props.index} />
          <span className="element-separator">:</span>
          <div className={HEADER_LABEL} onClick={this.toggleExpandable.bind(this)}>
            {this.element.currentType}
          </div>
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
  element: React.PropTypes.object.isRequired,
  index: React.PropTypes.number,
  indent: React.PropTypes.number
};

module.exports = EditableElement;
