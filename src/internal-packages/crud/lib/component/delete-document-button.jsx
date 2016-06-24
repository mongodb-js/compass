'use strict';

const React = require('react');

/**
 * Component for the edit document button.
 */
class DeleteDocumentButton extends React.Component {

  /**
   * The component constructor.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
  }

  /**
   * Render the button.
   *
   * @returns {Component} The button component.
   */
  render() {
    return (
      <button type='button' onClick={this.props.handler} title='Delete Document'>
        <i className="fa fa-trash-o" aria-hidden="true"></i>
      </button>
    );
  }
}

DeleteDocumentButton.displayName = 'DeleteDocumentButton';

module.exports = DeleteDocumentButton;
