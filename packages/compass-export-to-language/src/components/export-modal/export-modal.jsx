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
    useBuilders: PropTypes.func.isRequired,
    exportQuery: PropTypes.object.isRequired,
    setOutputLang: PropTypes.func.isRequired,
    toggleModal: PropTypes.func.isRequired,
    copyQuery: PropTypes.func.isRequired,
    clearCopy: PropTypes.func.isRequired,
    runQuery: PropTypes.func.isRequired
  };

  closeHandler = () => {
    this.props.toggleModal(false);
  };

  importsHandler = () => {
    this.props.includeImports(!this.props.exportQuery.showImports);
  };

  buildersHandler = () => {
    this.props.useBuilders(!this.props.exportQuery.builders);
    this.props.runQuery(this.props.exportQuery.outputLang, this.props.exportQuery.inputQuery);
  };

  renderBuilderCheckbox = () => {
    if (this.props.exportQuery.outputLang === 'java') {
      return (
        <div className={classnames(styles['export-to-lang-modal-checkbox-builders'])}>
          <Checkbox defaultChecked={this.props.exportQuery.builders}
                    data-test-id="export-to-lang-checkbox-builders"
                    onClick={this.buildersHandler}>
            Use Builders
          </Checkbox>
        </div>
      );
    }
    return null;
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
          <div className={classnames(styles['export-to-lang-modal-checkbox-imports'])}>
            <Checkbox data-test-id="export-to-lang-checkbox-imports" onClick={this.importsHandler}>
               Include Import Statements
           </Checkbox>
          </div>
          {this.renderBuilderCheckbox()}
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
