const React = require('react');
const PropTypes = require('prop-types');

const { IconButton } = require('hadron-react-buttons');

const BEM_BASE = 'table-view-row-actions';

/**
 * The row of buttons to be shown on mouse over.
 */
class RowActionsRenderer extends React.Component {
  constructor(props) {
    super(props);
    props.api.selectAll();
  }

  handleEdit() {
    console.log('handling edit button for row #' + this.props.value.rowNumber);
  }
  handleRemove() {
    console.log('handling delete button for row #' + this.props.value.rowNumber);
  }
  handleClone() {
    console.log('handling clone button for row #' + this.props.value.rowNumber);
  }
  handleCopy() {
    console.log('handle copy button for row #' + this.props.value.rowNumber);
  }

  render() {
    /* Don't show actions for rows that are being edited or marked for deletion */
    if (this.props.value.state === 'editing' || this.props.value.state === 'deleting') {
      return null;
    }

    return (
      <div className={BEM_BASE}>
        <div className={`${BEM_BASE}-panel`}>
        <IconButton
          title="Edit row"
          className={`${BEM_BASE}-panel-button btn btn-default btn-xs`}
          iconClassName={`${BEM_BASE}-button-icon fa fa-pencil`}
          clickHandler={this.handleEdit.bind(this)} />
        <IconButton
          title="Copy row"
          className={`${BEM_BASE}-panel-button btn btn-default btn-xs`}
          iconClassName={`${BEM_BASE}-button-icon fa fa-copy`}
          clickHandler={this.handleCopy.bind(this)} />
        <IconButton
          title="Clone row"
          className={`${BEM_BASE}-panel-button btn btn-default btn-xs`}
          iconClassName={`${BEM_BASE}-button-icon fa fa-clone`}
          clickHandler={this.handleClone.bind(this)} />
        <IconButton
          title="Delete row"
          className={`${BEM_BASE}-panel-button btn btn-default btn-xs`}
          iconClassName={`${BEM_BASE}-button-icon fa fa-trash-o`}
          clickHandler={this.handleRemove.bind(this)} />
      </div>
    </div>
    );
  }
}

RowActionsRenderer.propTypes = {
  api: PropTypes.any,
  value: PropTypes.any,
  node: PropTypes.any
};

RowActionsRenderer.displayName = 'RowActionsRenderer';

module.exports = RowActionsRenderer;
