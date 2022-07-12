import React from 'react';
import PropTypes from 'prop-types';
import { IconButton } from 'hadron-react-buttons';

const BEM_BASE = 'table-view-row-actions';

/**
 * The row of buttons to be shown on mouse over.
 */
class RowActionsRenderer extends React.Component {
  constructor(props) {
    super(props);
  }

  handleEdit() {
    this.props.context.addFooter(this.props.node, this.props.data, 'editing');
  }

  handleRemove() {
    this.props.context.addFooter(this.props.node, this.props.data, 'deleting');
  }

  handleClone() {
    this.props.context.handleClone(this.props.data);
  }

  handleCopy() {
    this.props.copyToClipboard(this.props.data.hadronDocument);
  }

  refresh() {
    return true;
  }

  renderTopLevelActions() {
    if (!this.props.nested) {
      return (
        <div>
          <IconButton
            title="Copy Document"
            className={`${BEM_BASE}-panel-button btn btn-default btn-xs document-actions-button-copy`}
            iconClassName={`${BEM_BASE}-button-icon fa fa-copy`}
            clickHandler={this.handleCopy.bind(this)}
          />
          <IconButton
            title="Clone Document"
            className={`${BEM_BASE}-panel-button btn btn-default btn-xs`}
            iconClassName={`${BEM_BASE}-button-icon fa fa-clone`}
            clickHandler={this.handleClone.bind(this)}
          />
          <IconButton
            title="Delete Document"
            className={`${BEM_BASE}-panel-button btn btn-default btn-xs`}
            iconClassName={`${BEM_BASE}-button-icon fa fa-trash-o`}
            clickHandler={this.handleRemove.bind(this)}
          />
        </div>
      );
    }
  }

  render() {
    /* Don't show actions for rows that are being edited or marked for deletion */
    if (
      this.props.value.state === 'editing' ||
      this.props.value.state === 'deleting' ||
      !this.props.isEditable
    ) {
      return null;
    }

    return (
      <div className={BEM_BASE}>
        <div className={`${BEM_BASE}-panel`}>
          <IconButton
            title="Edit Document"
            className={`${BEM_BASE}-panel-button btn btn-default btn-xs`}
            iconClassName={`${BEM_BASE}-button-icon fa fa-pencil`}
            clickHandler={this.handleEdit.bind(this)}
          />
          {this.renderTopLevelActions()}
        </div>
      </div>
    );
  }
}

RowActionsRenderer.propTypes = {
  api: PropTypes.any,
  value: PropTypes.any,
  node: PropTypes.any,
  context: PropTypes.any,
  data: PropTypes.any,
  nested: PropTypes.bool,
  isEditable: PropTypes.bool.isRequired,
  copyToClipboard: PropTypes.func.isRequired,
};

RowActionsRenderer.displayName = 'RowActionsRenderer';

export default RowActionsRenderer;
