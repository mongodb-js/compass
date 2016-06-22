'use strict';

const React = require('react');

/**
 * Component for actions on the document.
 */
class DocumentActions extends React.Component {

  /**
   * The component constructor.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
  }

  /**
   * Render the actions.
   *
   * @returns {Component} The actions component.
   */
  render() {
    return (
      <div className='document-actions'>
        <button type='button' onClick={this.props.edit}>Edit</button>
        <button type='button' onClick={this.props.remove}>Delete</button>
      </div>
    );
  }
}

DocumentActions.displayName = 'DocumentActions';

module.exports = DocumentActions;
