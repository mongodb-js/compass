import { TextButton } from 'hadron-react-buttons';
import { Modal, Checkbox } from 'react-bootstrap';
import ExportForm from 'components/export-form';
import React, { Component } from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';

import styles from './export-modal.less';

class ExportModal extends Component {
  static displayName = 'ExportModalComponent';

  static propTypes = {
    includeImports: PropTypes.func.isRequired,
    exportQuery: PropTypes.object.isRequired,
    setOutputLang: PropTypes.func.isRequired,
    togleModal: PropTypes.func.isRequired,
    copyQuery: PropTypes.func.isRequired,
    clearCopy: PropTypes.func.isRequired,
    runQuery: PropTypes.func.isRequired
  }

  closeHandler = () => {
    this.props.togleModal(false);
  };

  checkboxHandler = () => {
    this.props.includeImports(!this.props.exportQuery.imports);
  };

  render() {
    return (
      <Modal
        show={this.props.exportQuery.modalOpen}
        backdrop="static"
        bsSize="large"
        onHide={this.closeHandler}
        data-test-id="export-to-lang-modal"
        className={classnames(styles['export-to-lang-modal'])}>

        <Modal.Header>
          <Modal.Title data-test-id="export-to-lang-modal-title">
            {`Export ${this.props.exportQuery.namespace} To Language`}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body data-test-id="export-to-lang-modal-body">
          <ExportForm {...this.props}/>
          <div className={classnames(styles['export-to-lang-modal-checkbox'])}>
            <Checkbox data-test-id="export-to-lang-checkbox" onClick={this.checkboxHandler}>
               Include Import Statements
           </Checkbox>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <TextButton
            data-test-id="export-to-lang-close"
            className="btn btn-default btn-sm"
            text="Close"
            clickHandler={this.closeHandler} />
        </Modal.Footer>
      </Modal>
    );
  }
}

export default ExportModal;
