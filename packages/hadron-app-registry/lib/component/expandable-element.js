'use strict';

const React = require('react');
const Field = require('./field');

/**
 * Component for an element that can be expanded.
 */
class ExpandableElement extends React.Component {

  /**
   * Initialize the element.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    this.state = { expanded: false };
  }

  /**
   * Get the class of the element - varies if the element is expanded or not.
   *
   * @returns {String} The element class.
   */
  style(base) {
    if (this.state.expanded) {
      return `${ base } ${ base }-is-expanded`;
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
   * Render an expandable element - array or object.
   *
   * @returns {React.Component} The expandable element component.
   */
  render() {
    return React.createElement(
      'li',
      { className: 'expandable-element' },
      React.createElement(
        'div',
        { className: this.style('expandable-element-header'), onClick: this.toggleExpandable.bind(this) },
        React.createElement('div', { className: 'expandable-element-header-toggle' }),
        React.createElement(
          'div',
          { className: 'expandable-element-header-field' },
          this.props.field
        ),
        React.createElement(
          'span',
          { className: 'expandable-element-header-separator' },
          ':'
        ),
        React.createElement(
          'div',
          { className: 'expandable-element-header-label' },
          this.props.label
        )
      ),
      React.createElement(
        'ol',
        { className: this.style('expandable-element-children') },
        this.props.elements
      )
    );
  }
}

ExpandableElement.displayName = 'ExpandableElement';

ExpandableElement.propTypes = {
  field: React.PropTypes.string.isRequired,
  label: React.PropTypes.string.isRequired,
  elements: React.PropTypes.any
};

module.exports = ExpandableElement;