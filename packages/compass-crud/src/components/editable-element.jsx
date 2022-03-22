import React from 'react';
import PropTypes from 'prop-types';
import { BSONValue } from '@mongodb-js/compass-components';
import { Element } from 'hadron-document';
import EditableKey from './editable-key';
import EditableValue from './editable-value';
import ElementAction from './element-action';
import LineNumber from './line-number';
import Types from './types';

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
 * Wrapper class.
 */
const WRAPPER = 'editable-element-value-wrapper';

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
    this.state = {
      expanded: this.props.expandAll,
      expandAll: this.props.expandAll,
      focusKey: false,
      focusValue: false
    };
  }

  /**
   * Subscribe to the events.
   */
  componentDidMount() {
    this.unsubscribeAdded = this.handleExpand.bind(this);
    this.unsubscribeConverted = this.handleExpand.bind(this);
    this.unsubscribeEdited = this.handleChange.bind(this);
    this.unsubscribeRemoved = this.handleChange.bind(this);
    this.unsubscribeReverted = this.handleChange.bind(this);
    this.unsubscribeInvalid = this.handleChange.bind(this);

    this.element.on(Element.Events.Added, this.unsubscribeAdded);
    this.element.on(Element.Events.Converted, this.unsubscribeConverted);
    this.element.on(Element.Events.Edited, this.unsubscribeEdited);
    this.element.on(Element.Events.Removed, this.unsubscribeRemoved);
    this.element.on(Element.Events.Reverted, this.unsubscribeReverted);
    this.element.on(Element.Events.Invalid, this.unsubscribeInvalid);
  }

  /**
   * Set the state if the expand all prop changes.
   *
   * @param {Object} nextProps - The next properties.
   */
  componentWillReceiveProps(nextProps) {
    const state = {};
    if (!nextProps.editing) {
      state.focusKey = false;
      state.focusValue = false;
    }

    if (nextProps.expandAll !== this.state.expandAll) {
      state.expanded = nextProps.expandAll;
      state.expandAll = nextProps.expandAll;
    }

    this.setState(state);
  }

  /**
   * Unsubscribe from the events.
   */
  componentWillUnmount() {
    this.element.removeListener(Element.Events.Added, this.unsubscribeAdded);
    this.element.removeListener(Element.Events.Converted, this.unsubscribeConverted);
    this.element.removeListener(Element.Events.Edited, this.unsubscribeEdited);
    this.element.removeListener(Element.Events.Removed, this.unsubscribeRemoved);
    this.element.removeListener(Element.Events.Reverted, this.unsubscribeReverted);
    this.element.removeListener(Element.Events.Invalid, this.unsubscribeInvalid);
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
    this.forceUpdate();
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

  focusEditKey() {
    if (this.props.edit) {
      this.props.edit();
    }
    this.setState({focusKey: true});
  }

  focusEditValue() {
    if (this.props.edit) {
      this.props.edit();
    }
    this.setState({focusValue: true});
  }

  /**
   * Get the components for the elements.
   *
   * @returns {Array} The components.
   */
  renderChildren() {
    const components = [];
    if (!this.state.expanded && !this.props.expandAll) {
      // COMPASS-1312 Lazily render children when user clicks on expand
      return components;
    }
    let index = 0;
    for (const element of this.element.elements) {
      components.push((
        <EditableElement
          key={element.uuid}
          element={element}
          version={this.props.version}
          index={index}
          indent={this.props.indent + 16}
          editing={this.props.editing}
          edit={this.props.edit}
          expandAll={this.props.expandAll}
          tz={this.props.tz}
        />
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
      return (<Types element={this.element} version={this.props.version} />);
    }
  }

  /**
   * Render the key column.
   *
   * @returns {React.Component} The component.
   */
  renderKey() {
    if (this.props.editing && this.element.isKeyEditable()) {
      return (
        <EditableKey element={this.element} index={this.props.index} isFocused={this.state.focusKey} />
      );
    }
    const onDoubleClick = this.element.isKeyEditable() ? null : this.focusEditKey.bind(this);
    return (
      <div className={FIELD_CLASS} onClick={this.toggleExpandable.bind(this)} onDoubleClick={onDoubleClick}>
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
        onClick={this.toggleExpandable.bind(this)}/>
    );
  }

  /**
   * Render the expandable label column.
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
      return (<EditableValue element={this.element} isFocused={this.state.focusValue} version={this.props.version} tz={this.props.tz}/>);
    }
    return (
      <span className={WRAPPER} onDoubleClick={this.focusEditValue.bind(this)}>
        <BSONValue
          type={this.element.currentType}
          value={this.element.currentValue}
        />
      </span>
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
          {this.renderTypes()}
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
  editing: PropTypes.bool,
  edit: PropTypes.func,
  tz: PropTypes.string,
  element: PropTypes.object.isRequired,
  version: PropTypes.string.isRequired,
  index: PropTypes.number,
  indent: PropTypes.number,
  expandAll: PropTypes.bool
};

export default EditableElement;
