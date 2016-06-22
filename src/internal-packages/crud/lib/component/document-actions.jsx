'use strict';

const React = require('react');
const EditDocumentButton = require('./edit-document-button');
const DeleteDocumentButton = require('./delete-document-button');

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
        <EditDocumentButton handler={this.props.edit} />
        <DeleteDocumentButton handler={this.props.remove} />
      </div>
    );
  }
}

DocumentActions.displayName = 'DocumentActions';

module.exports = DocumentActions;
