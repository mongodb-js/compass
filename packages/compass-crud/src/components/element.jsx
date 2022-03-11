import React from 'react';
import PropTypes from 'prop-types';
import { BSONValue } from '@mongodb-js/compass-components';

/**
 * The base class.
 */
const CLASS = 'element';

/**
 * The field class.
 */
const FIELD = `${CLASS}-field`;

/**
 * The separator class.
 */
const SEPARATOR = `${CLASS}-separator`;

/**
 * The expandable element class.
 */
const EXP_CLASS = 'expandable-element';

/**
 * The expandable header class.
 */
const EXP_HEADER = `${EXP_CLASS}-header`;

/**
 * The carat toggle class.
 */
const EXP_TOGGLE = `${EXP_HEADER}-toggle`;

/**
 * The expandable field class.
 */
const EXP_FIELD = `${EXP_HEADER}-field`;

/**
 * The expandable label class.
 */
const EXP_LABEL = `${EXP_HEADER}-label`;

/**
 * The expandable children class.
 */
const EXP_CHILDREN = `${EXP_CLASS}-children`;

/**
 * The expandable element separator class.
 */
const EXP_SEPARATOR = `${EXP_HEADER}-separator`;

/**
 * General element component.
 */
class Element extends React.Component {
  /**
   * Instantiate the element.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    this.state = { expanded: props.expandAll };
  }

  /**
   * Get the full class name for the base style.
   *
   * @param {String} base - The base class.
   *
   * @returns {String} The full class name.
   */
  getClassName(base) {
    if (this.state.expanded) {
      return `${base} ${base}-is-expanded`;
    }
    return base;
  }

  /**
   * Toggles the expandable aspect of the element.
   */
  toggleExpandable() {
    this.setState({ expanded: !this.state.expanded });
  }

  /**
   * Render the children.
   *
   * @returns {Array} The children.
   */
  renderChildren() {
    const components = [];
    if (!this.state.expanded && !this.props.expandAll) {
      // COMPASS-1312 Lazily render children when user clicks on expand
      return components;
    }
    for (const element of this.props.element.elements) {
      components.push(
        (<Element
          key={element.uuid}
          element={element}
          expandAll={this.props.expandAll}
          tz={this.props.tz}
        />)
      );
    }
    return components;
  }

  /**
   * Render a single element.
   *
   * @returns {React.Component} The single element.
   */
  renderElement() {
    return (
      <li className={CLASS}>
        <div className={FIELD}>
          {this.props.element.currentKey}
        </div>
        <span className={SEPARATOR}>:</span>
        {this.renderValue()}
      </li>
    );
  }

  /**
   * Render a single expandable element.
   *
   * @returns {React.Component} The expandable element.
   */
  renderExpandableElement() {
    return (
      <li className={EXP_CLASS}>
        <div className={this.getClassName(EXP_HEADER)} onClick={this.toggleExpandable.bind(this)}>
          <div className={EXP_TOGGLE}/>
          <div className={EXP_FIELD}>{this.props.element.currentKey}</div>
          <span className={EXP_SEPARATOR}>:</span>
          <div className={EXP_LABEL}>
            {this.props.element.currentType}
          </div>
        </div>
        <ol className={this.getClassName(EXP_CHILDREN)}>
          {this.renderChildren()}
        </ol>
      </li>
    );
  }

  /**
   * Render the value of the element.
   *
   * @returns {React.Component} The value component.
   */
  renderValue() {
    return (
      <BSONValue
        type={this.props.element.currentType}
        value={this.props.element.currentValue}
      />
    );
  }

  /**
   * Render a single element in a document.
   *
   * @returns {React.Component} The element component.
   */
  render() {
    return this.props.element.elements ? this.renderExpandableElement() : this.renderElement();
  }
}

Element.displayName = 'Element';

Element.propTypes = {
  element: PropTypes.any.isRequired,
  expandAll: PropTypes.bool,
  tz: PropTypes.string
};

export default Element;
