import React from 'react';
import PropTypes from 'prop-types';
import { IconButton } from 'hadron-react-buttons';
import UpdatableIconButton from './/updatable-icon-button';

/**
 * Component for actions on the document.
 */
class DocumentActions extends React.Component {
  /**
   * Instantiate the actions.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    this.state = { allExpanded: props.allExpanded };
  }

  /**
   * Set the state when new props are received.
   *
   * @param {Object} nextProps - The new props.
   */
  componentWillReceiveProps(nextProps) {
    if (nextProps.allExpanded !== this.state.allExpanded) {
      this.setState({ allExpanded: nextProps.allExpanded });
    }
  }

  /**
   * Render the expand all button.
   *
   * @returns {React.Component} The expand all button.
   */
  renderExpandAll() {
    if (this.props.expandAll) {
      const title = this.state.allExpanded ? 'Collapse All' : 'Expand All';
      const iconClass = this.state.allExpanded ? 'fa-angle-down' : 'fa-angle-right';
      return (
        <div className="document-actions-left">
          <UpdatableIconButton
            title={title}
            clickHandler={this.props.expandAll}
            className="document-actions-button document-actions-expand-button btn btn-default btn-xs"
            iconClassName={`document-actions-button-icon fa ${iconClass}`}
            dataTestId="expand-all-button" />
        </div>
      );
    }
  }

  /**
   * Render the actions.
   *
   * @returns {Component} The actions component.
   */
  render() {
    return (
      <div className="document-actions">
        {this.renderExpandAll()}
        <div className="document-actions-right">
          <IconButton
            title="Edit Document"
            className="document-actions-button btn btn-default btn-xs"
            iconClassName="document-actions-button-icon fa fa-pencil"
            dataTestId="edit-document-button"
            clickHandler={this.props.edit} />
          <IconButton
            title="Copy Document"
            className="document-actions-button document-actions-button-copy btn btn-default btn-xs"
            iconClassName="document-actions-button-icon fa fa-copy"
            dataTestId="copy-document-button"
            clickHandler={this.props.copy} />
          <IconButton
            title="Clone Document"
            className="document-actions-button btn btn-default btn-xs"
            iconClassName="document-actions-button-icon fa fa-clone"
            dataTestId="clone-document-button"
            clickHandler={this.props.clone} />
          <IconButton
            title="Delete Document"
            className="document-actions-button btn btn-default btn-xs"
            iconClassName="document-actions-button-icon fa fa-trash-o"
            dataTestId="delete-document-button"
            clickHandler={this.props.remove} />
        </div>
      </div>
    );
  }
}

DocumentActions.displayName = 'DocumentActions';

DocumentActions.propTypes = {
  edit: PropTypes.func.isRequired,
  copy: PropTypes.func.isRequired,
  remove: PropTypes.func.isRequired,
  clone: PropTypes.func.isRequired,
  allExpanded: PropTypes.bool,
  expandAll: PropTypes.func
};

export default DocumentActions;
