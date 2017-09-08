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
    console.log('handling edit button');
  }
  handleRemove() {
    console.log('handling delete button');
  }
  handleClone() {
    console.log('handling clone button');
  }
  handleCopy() {
    console.log('handle copy button');
  }

  render() {
    return (
      <div className={BEM_BASE}>
        <IconButton
          title="Edit row"
          className={`${BEM_BASE}-button btn btn-default btn-xs`}
          iconClassName={`${BEM_BASE}-button-icon fa fa-pencil`}
          clickHandler={this.handleEdit.bind(this)} />
        <IconButton
          title="Copy row"
          className={`${BEM_BASE}-button btn btn-default btn-xs`}
          iconClassName={`${BEM_BASE}-button-icon fa fa-copy`}
          clickHandler={this.handleCopy.bind(this)} />
        <IconButton
          title="Clone row"
          className={`${BEM_BASE}-button btn btn-default btn-xs`}
          iconClassName={`${BEM_BASE}-button-icon fa fa-clone`}
          clickHandler={this.handleClone.bind(this)} />
        <IconButton
          title="Delete row"
          className={`${BEM_BASE}-button btn btn-default btn-xs`}
          iconClassName={`${BEM_BASE}-button-icon fa fa-trash-o`}
          clickHandler={this.handleRemove.bind(this)} />
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
