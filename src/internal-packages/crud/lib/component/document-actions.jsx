'use strict';

const React = require('react');
const app = require('ampersand-app');
const IconButton = require('./icon-button');

/**
 * The feature flag.
 */
const FEATURE = 'singleDocumentCrud';

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
    if (app.isFeatureEnabled(FEATURE)) {
      return (
        <div className='document-actions'>
          <IconButton
            title='Edit Document'
            iconClassName='fa fa-pencil'
            clickHandler={this.props.edit} />
          <IconButton
            title='Delete Document'
            iconClassName='fa fa-trash-o'
            clickHandler={this.props.remove} />
          <IconButton
            title='Clone Document'
            iconClassName='fa fa-clone'
            clickHandler={this.props.clone} />
        </div>
      );
    }
    return (
      <div className='document-actions'></div>
    );
  }
}

DocumentActions.displayName = 'DocumentActions';

module.exports = DocumentActions;
