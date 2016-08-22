'use strict';

const React = require('react');
const IconButton = require('hadron-app-registry').IconButton;

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
}

DocumentActions.displayName = 'DocumentActions';

module.exports = DocumentActions;
