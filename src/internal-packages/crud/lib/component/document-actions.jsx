const React = require('react');
const { IconButton } = require('hadron-react-buttons');

/**
 * Component for actions on the document.
 */
class DocumentActions extends React.Component {

  /**
   * Render the actions.
   *
   * @returns {Component} The actions component.
   */
  render() {
    return (
      <div className="document-actions">
        <IconButton
          title="Expand All"
          clickHandler={this.props.expandAll}
          className="document-actions-button btn btn-default btn-xs"
          iconClassName="document-actions-button-icon fa fa-caret-down"
          dataTestId="expand-all-button" />
        <IconButton
          title="Collapse All"
          clickHandler={this.props.collapseAll}
          className="document-actions-button btn btn-default btn-xs"
          iconClassName="document-actions-button-icon fa fa-caret-up"
          dataTestId="collapse-all-button" />
        <IconButton
          title="Edit Document"
          className="document-actions-button btn btn-default btn-xs"
          iconClassName="document-actions-button-icon fa fa-pencil"
          dataTestId="edit-document-button"
          clickHandler={this.props.edit} />
        <IconButton
          title="Delete Document"
          className="document-actions-button btn btn-default btn-xs"
          iconClassName="document-actions-button-icon fa fa-trash-o"
          dataTestId="delete-document-button"
          clickHandler={this.props.remove} />
        <IconButton
          title="Clone Document"
          className="document-actions-button btn btn-default btn-xs"
          iconClassName="document-actions-button-icon fa fa-clone"
          dataTestId="clone-document-button"
          clickHandler={this.props.clone} />
      </div>
    );
  }
}

DocumentActions.displayName = 'DocumentActions';

DocumentActions.propTypes = {
  edit: React.PropTypes.func.isRequired,
  remove: React.PropTypes.func.isRequired,
  clone: React.PropTypes.func.isRequired,
  expandAll: React.PropTypes.func.isRequired,
  collapseAll: React.PropTypes.func.isRequired
};

module.exports = DocumentActions;
