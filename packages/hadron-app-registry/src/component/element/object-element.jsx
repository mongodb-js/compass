'use strict';

const React = require('react');
const ExpandableElement = require('../expandable-element');
const Factory = require('./factory');

/**
 * Component for object types.
 */
class ObjectElement extends React.Component {

  /**
   * Render an object element.
   */
  render() {
    return (
      <ExpandableElement
        elements={Factory.elements(this.props.value)}
        field={this.props.field}
        value={this.props.value}
        type={this.props.type}
        label={this.props.type}
        preExpanded={this.props.preExpanded} />
    );
  }
}

ObjectElement.displayName = 'ObjectElement';

module.exports = ObjectElement;
