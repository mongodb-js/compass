import { TextButton } from 'hadron-react-buttons';
import { Modal, Checkbox } from 'react-bootstrap';
import ExportForm from 'components/export-form';
import React, { PureComponent } from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';

import styles from './export-modal.less';

class ExportModal extends PureComponent {
  static displayName = 'ExportModalComponent';

  static propTypes = {
    copySuccess: PropTypes.string,
    copyToClipboard: PropTypes.func.isRequired,
    builders: PropTypes.bool.isRequired,
    driver: PropTypes.bool.isRequired,
    imports: PropTypes.string.isRequired,
    showImports: PropTypes.bool.isRequired,
    inputExpression: PropTypes.object.isRequired,
    transpiledExpression: PropTypes.string.isRequired,
    modalOpen: PropTypes.bool.isRequired,
    mode: PropTypes.string.isRequired,
    outputLang: PropTypes.string.isRequired,
    error: PropTypes.string,
    uri: PropTypes.string.isRequired,
    showImportsChanged: PropTypes.func.isRequired,
    buildersChanged: PropTypes.func.isRequired,
    driverChanged: PropTypes.func.isRequired,
    outputLangChanged: PropTypes.func.isRequired,
    copySuccessChanged: PropTypes.func.isRequired,
    modalOpenChanged: PropTypes.func.isRequired,
    runTranspiler: PropTypes.func.isRequired
  };

  closeHandler = () => {
    this.props.modalOpenChanged(false);
  };

  importsHandler = () => {
    this.props.showImportsChanged(!this.props.showImports);
  };

  buildersHandler = () => {
    this.props.buildersChanged(!this.props.builders);
    this.props.runTranspiler(this.props.inputExpression);
  };

  driverHandler = () => {
    this.props.driverChanged(!this.props.driver);
    this.props.runTranspiler(this.props.inputExpression);
  };

  renderBuilderCheckbox = () => {
    if (this.props.outputLang === 'java' && this.props.mode === 'Query') {
      return (
        <div className={classnames(styles['export-to-lang-modal-checkbox-builders'])}>
          <Checkbox defaultChecked={this.props.builders}
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
        show={this.props.modalOpen}
        backdrop="static"
        bsSize="large"
        onHide={this.closeHandler}
        data-test-id="export-to-lang-modal"
        className={classnames(styles['export-to-lang-modal'])}>

        <Modal.Header>
          <Modal.Title data-test-id="export-to-lang-modal-title">
            {`Export ${this.props.mode} To Language`}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body data-test-id="export-to-lang-modal-body">
          <ExportForm {...this.props} from={this.props.mode === 'Query' ? this.props.inputExpression.filter : this.props.inputExpression.aggregation}/>
          <div className={classnames(styles['export-to-lang-modal-checkbox-imports'])}>
            <Checkbox data-test-id="export-to-lang-checkbox-imports" onClick={this.importsHandler} defaultChecked={this.props.showImports}>
               Include Import Statements
           </Checkbox>
          </div>
          <div className={classnames(styles['export-to-lang-modal-checkbox-driver'])}>
            <Checkbox data-test-id="export-to-lang-checkbox-driver" onClick={this.driverHandler} defaultChecked={this.props.driver}>
              Include Driver Syntax
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
