const React = require('react');
const Modal = require('react-bootstrap').Modal;

const InputModal = React.createClass({

  propTypes: {
    open: React.PropTypes.bool.isRequired,
    close: React.PropTypes.func.isRequired,
    apply: React.PropTypes.func.isRequired
  },

  onContinue() {
    this.props.apply();
    this.props.close();
  },

  render() {
    return (
      <Modal show={this.props.open}
        backdrop="static"
        keyboard={false}>

        <div>
          <Modal.Header>
            <Modal.Title>You are about to run explain on the entire collection</Modal.Title>
          </Modal.Header>

          <Modal.Body>
          <div className="input-modal-content">
            <button
              className="btn btn-default input-modal-close"
              type="button"
              onClick={this.props.close}>
              Cancel
            </button>
            <button
              className="btn btn-warning input-modal-continue"
              type="submit"
              onClick={this.onContinue}>
              Continue
            </button>
          </div>
          </Modal.Body>
        </div>
      </Modal>
    );
  }
});

InputModal.displayName = 'InputModal';

module.exports = InputModal;
