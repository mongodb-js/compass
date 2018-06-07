import { TextButton } from 'hadron-react-buttons';
import ExportForm from 'components/export-form';
import React, { Component } from 'react';
import { Modal } from 'react-bootstrap';
import PropTypes from 'prop-types';

class ExportModal extends Component {
  static displayName = 'ExportModalComponent';

  static propTypes = {
    exportQuery: PropTypes.object.isRequired,
    setOutputLang: PropTypes.func.isRequired,
    togleModal: PropTypes.func.isRequired,
    copyQuery: PropTypes.func.isRequired,
    runQuery: PropTypes.func.isRequired
  }

  closeHandler = () => {
    this.props.togleModal(false);
  };

  render() {
    return (
      <Modal
        show={this.props.exportQuery.modalOpen}
        backdrop="static"
        bsSize="large"
        onHide={this.closeHandler}
        dialogClassName="export-to-lang-modal">

        <Modal.Header>
          <Modal.Title>Export Query To Language</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <ExportForm {...this.props}/>
        </Modal.Body>

        <Modal.Footer>
          <TextButton className="btn btn-default btn-sm" text="Close" clickHandler={this.closeHandler} />
        </Modal.Footer>
      </Modal>
    );
  }
}

export default ExportModal;
