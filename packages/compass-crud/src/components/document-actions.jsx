import React from 'react';
import PropTypes from 'prop-types';
import { IconButton } from 'hadron-react-buttons';
import UpdatableIconButton from './updatable-icon-button';

/**
 * Component for actions on the document.
 */
class DocumentActions extends React.Component {
  /**
   * Render the expand all button.
   *
   * @returns {React.Component} The expand all button.
   */
  renderExpandAll() {
    const title = this.props.allExpanded ? 'Collapse All' : 'Expand All';
    const iconClass = this.props.allExpanded ? 'fa-angle-down' : 'fa-angle-right';
    return (
      <div className="document-actions-left">
        <UpdatableIconButton
          title={title}
          clickHandler={this.props.expandAll}
          className="document-actions-button document-actions-expand-button btn btn-default btn-xs"
          iconClassName={`document-actions-button-icon fa ${iconClass}`}
          dataTestId="expand-all-button"
        />
      </div>
    );
  }

  /**
   * Render the actions.
   *
   * @returns {Component} The actions component.
   */
  render() {
    return (
      <div className="document-actions">
        {this.props.expandAll && this.renderExpandAll()}
        <div className="document-actions-right">
          {this.props.edit && <IconButton
            title="Edit Document"
            className="document-actions-button btn btn-default btn-xs"
            iconClassName="document-actions-button-icon fa fa-pencil"
            dataTestId="edit-document-button"
            clickHandler={this.props.edit}
          />}
          {this.props.copy && <IconButton
            title="Copy Document"
            className="document-actions-button document-actions-button-copy btn btn-default btn-xs"
            iconClassName="document-actions-button-icon fa fa-copy"
            dataTestId="copy-document-button"
            clickHandler={this.props.copy}
          />}
          {this.props.clone && <IconButton
            title="Clone Document"
            className="document-actions-button btn btn-default btn-xs"
            iconClassName="document-actions-button-icon fa fa-clone"
            dataTestId="clone-document-button"
            clickHandler={this.props.clone}
          />}
          {this.props.remove && <IconButton
            title="Delete Document"
            className="document-actions-button btn btn-default btn-xs"
            iconClassName="document-actions-button-icon fa fa-trash-o"
            dataTestId="delete-document-button"
            clickHandler={this.props.remove}
          />}
        </div>
      </div>
    );
  }
}

DocumentActions.displayName = 'DocumentActions';

DocumentActions.propTypes = {
  copy: PropTypes.func,
  edit: PropTypes.func,
  remove: PropTypes.func,
  clone: PropTypes.func,
  allExpanded: PropTypes.bool,
  expandAll: PropTypes.func
};

export default DocumentActions;
