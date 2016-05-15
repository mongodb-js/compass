'use strict';

const React = require('react');
const Field = require('./field');

/**
 * The class for the document itself.
 */
const DOCUMENT_CLASS = 'document-property-body';

/**
 * The header class for expandable elements.
 */
const HEADER_CLASS = 'document-property-header';

/**
 * The caret for expanding elements.
 */
const CARET = 'caret';

/**
 * The expanded class name.
 */
const EXPANDED = 'expanded';

/**
 * The expandable label class.
 */
const LABEL_CLASS = 'document-property-type-label';

/**
 * The property class.
 */
const PROPERTY_CLASS = 'document-property';

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
    return (
      <li className={`${this._elementClass()}`}>
        <div className={HEADER_CLASS} onClick={this.toggleExpandable.bind(this)}>
          <div className={CARET}>
          </div>
          <Field field={this.props.field} />
          :
          <div className={LABEL_CLASS}>
            {this.props.label}
          </div>
        </div>
        <ol className={DOCUMENT_CLASS}>
          {this.props.elements}
        </ol>
      </li>
    );
  }

  /**
   * Get the class of the element - varies if the element is expanded or not.
   *
   * @returns {String} The element class.
   */
  _elementClass() {
    var typeClass = this.props.type.toLowerCase();
    if (this.state.expanded) {
      return `${PROPERTY_CLASS} ${typeClass} ${EXPANDED}`
    }
    return `${PROPERTY_CLASS} ${typeClass}`;
  }
}

ExpandableElement.displayName = 'ExpandableElement';

module.exports = ExpandableElement;
