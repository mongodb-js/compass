const React = require('react');
const Modal = require('react-bootstrap').Modal;
const Action = require('../action/index-actions');

/**
 * Component for the drop confirmation modal.
 */
class DropIndexModal extends React.Component {

  /**
   * The component constructor.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    this.state = {
      confirmName: ''
    };
  }

  /**
   * Close drop index modal when cancel is clicked.
   */
  handleCancel() {
    this.props.close();
  }

  /**
   * Update state value for confirm name as user types.
   *
   * @param {Object} evt - The click event.
   */
  handleChange(evt) {
    this.setState({ confirmName: evt.target.value });
  }

  /**
   * Drop index and close modal when confirm is clicked.
   *
   * @param {Object} evt - The click event.
   */
  handleConfirm(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    Action.dropIndex(this.props.indexName);
    this.props.close();
  }

  /**
   * Render drop confirmation modal.
   *
   * @returns {React.Component} drop confirmation modal.
   */
  render() {
    return (
      <Modal show={this.props.open}
        backdrop="static"
        dialogClassName="drop-index-modal"
        keyboard={false}
        onHide={this.props.close} >
        <div className="drop-index-modal-content">
          <Modal.Header>
            <Modal.Title>Index Drop</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <div>
              <p className="drop-confirm-message">
                <i className="drop-confirm-icon fa fa-exclamation-triangle" aria-hidden="true"></i>
                Type the index name
                <strong> {this.props.indexName} </strong>
                to drop
              </p>
            </div>
            <form onSubmit={this.handleConfirm.bind(this)}>
              <div className="form-group">
                <input
                  type="text"
                  className="drop-confirm-input form-control"
                  value={this.state.confirmName}
                  onChange={this.handleChange.bind(this)} />
              </div>
              <div className="drop-btn-container">
                <button
                  className="drop-btn btn btn-default btn-sm"
                  type="button"
                  onClick={this.handleCancel.bind(this)}>
                  Cancel
                </button>
                <button
                  className="drop-btn btn btn-primary btn-sm"
                  disabled={this.state.confirmName !== this.props.indexName}
                  type="submit">
                  Drop
                </button>
              </div>
            </form>
          </Modal.Body>
        </div>
      </Modal>
    );
  }
}

DropIndexModal.displayName = 'DropIndexModal';

DropIndexModal.propTypes = {
  close: React.PropTypes.func.isRequired,
  indexName: React.PropTypes.string.isRequired,
  open: React.PropTypes.bool.isRequired
};

module.exports = DropIndexModal;
