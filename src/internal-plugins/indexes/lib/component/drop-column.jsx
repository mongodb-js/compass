const React = require('react');
const PropTypes = require('prop-types');
const DropIndexModal = require('./drop-index-modal');

/**
 * Component for the drop column.
 */
class DropColumn extends React.Component {

  /**
   * The component constructor.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    this.state = {
      showModal: false
    };
  }

  /**
   * Show drop index modal when drop button is clicked.
   *
   * @param {Object} evt - The click event.
   */
  clickDropHandler(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    this.setState({ showModal: true });
  }

  /**
   * Close the drop index modal.
   */
  close() {
    this.setState({ showModal: false });
  }

  /**
   * Render the drop column.
   *
   * @returns {React.Component} The drop column.
   */
  render() {
    return (
      <td className="drop-column">
        {this.props.indexName !== '_id_' ?
          <button
            className="drop-btn btn btn-default btn-sm"
            type="button"
            onClick={this.clickDropHandler.bind(this)}>
            <i className="drop-column-icon fa fa-trash-o"/>
         </button>
        : null}
        <DropIndexModal
          indexName={this.props.indexName}
          open={this.state.showModal}
          close={this.close.bind(this)} />
      </td>
    );
  }
}

DropColumn.displayName = 'DropColumn';

DropColumn.propTypes = {
  indexName: PropTypes.string.isRequired
};

module.exports = DropColumn;
