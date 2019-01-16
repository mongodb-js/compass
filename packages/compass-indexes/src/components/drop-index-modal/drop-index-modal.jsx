import React from 'react';
import PropTypes from 'prop-types';
import { Modal } from 'react-bootstrap';
import { ModalStatusMessage } from 'hadron-react-components';
import Actions from 'actions';
import { DDLStatusStore } from 'stores';

// const debug = require('debug')('mongodb-compass:ddl:index');

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
   * Subscribe on mount.
   */
  componentWillMount() {
    this.unsubscribeDDLStatus = DDLStatusStore.listen(this.handleStatusChange.bind(this));
  }

  /**
   * Unsubscribe on unmount.
   */
  componentWillUnmount() {
    this.unsubscribeDDLStatus();
  }

  /**
   * Handle changes in creation state (success, error, or complete).
   *
   * @param {string} status - The status.
   * @param {string} message - The error message.
   */
  handleStatusChange(status, message) {
    if (status === 'inProgress') {
      this.setState({inProgress: true, error: false, errorMessage: message});
    } else if (status === 'error') {
      this.setState({inProgress: false, error: true, errorMessage: message});
    } else {
      this.handleClose();
    }
  }

  /**
   * Clean up after a close events
   */
  handleClose() {
    // this.props.indexName = '';
    this.setState({inProgress: false, error: false, errorMessage: ''});
    this.props.close();
  }

  /**
   * Close drop index modal when cancel is clicked.
   */
  handleCancel() {
    Actions.updateStatus('cancel');
    this.handleClose();
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
    Actions.dropIndex(this.props.indexName);
    // this.props.close();
  }

  /**
   * Render the create and cancel buttons.
   *
   * @returns {React.Component} The create and cancel buttons.
   */
  renderButtons() {
    return (
      <div className="drop-btn-container">
        <button
          className="drop-btn btn btn-default btn-sm"
          type="button"
          onClick={this.handleCancel.bind(this)}>
          Cancel
        </button>
        <button
          className="drop-btn btn btn-alert btn-sm"
          disabled={this.state.confirmName !== this.props.indexName}
          type="submit">
          Drop
        </button>
      </div>
    );
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
        onHide={this.handleClose.bind(this)} >
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
                  autoFocus
                  type="text"
                  className="drop-confirm-input form-control"
                  value={this.state.confirmName}
                  onChange={this.handleChange.bind(this)} />
              </div>
              {this.state.error ?
                <ModalStatusMessage icon="times" message={this.state.errorMessage} type="error" />
                : null}

              {this.state.inProgress ?
                <ModalStatusMessage icon="spinner" message={'Drop in Progress'} type="in-progress" />
                : this.renderButtons()}
            </form>
          </Modal.Body>
        </div>
      </Modal>
    );
  }
}

DropIndexModal.displayName = 'DropIndexModal';

DropIndexModal.propTypes = {
  close: PropTypes.func.isRequired,
  indexName: PropTypes.string.isRequired,
  open: PropTypes.bool.isRequired
};

export default DropIndexModal;
