'use strict';

const React = require('react');

/**
 * The classname for the form-item component.
 */
const CLASS = 'form-item';

/**
 * Represents a form item component.
 */
class FormItem extends React.Component {

  /**
   * Renders the form item component.
   *
   * @returns {Object} The component HTML.
   */
  render() {
    return React.createElement(
      'div',
      { className: CLASS },
      React.createElement(
        'label',
        null,
        this.props.label
      ),
      this.props.children
    );
  }
}

FormItem.displayName = 'FormItem';

module.exports = FormItem;