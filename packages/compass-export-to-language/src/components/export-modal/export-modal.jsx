import { TextButton } from 'hadron-react-buttons';
import { Modal, Checkbox } from 'react-bootstrap';
import ExportForm from '../export-form';
import React, { PureComponent } from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';

import styles from './export-modal.module.less';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import { countAggregationStagesInString } from '../../modules/count-aggregation-stages-in-string';
const { track } = createLoggerAndTelemetry('COMPASS-EXPORT-TO-LANGUAGE-UI');

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

  showHandler = () => {
    track(this.props.mode === 'Query' ? 'Query Export Opened' : 'Aggregation Export Opened', {
      ...this.stageCountForTelemetry()
    });
    track('Screen', { name: 'export_to_language_modal' });
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

  stageCountForTelemetry = () => {
    if (this.props.mode === 'Query') {
      return {};
    }

    try {
      return {
        num_stages: countAggregationStagesInString(this.props.inputExpression.aggregation)
      };
    } catch (ignore) {
      // Things like [{ $match: { x: NumberInt(10) } }] do not evaluate in any kind of context
      return { num_stages: -1 };
    }
  };

  copySuccessChanged = (field) => {
    if (field === 'output') {
      let event;
      if (this.props.mode === 'Query') {
        event = 'Query Exported';
      } else {
        event = 'Aggregation Exported';
      }
      track(event, {
        language: this.props.outputLang,
        with_import_statements: this.props.showImports,
        with_builders: this.props.builders,
        with_drivers_syntax: this.props.driver,
        ...this.stageCountForTelemetry()
      });
    }
    this.props.copySuccessChanged(field);
  };

  renderBuilderCheckbox = () => {
    if (this.props.outputLang === 'java' && this.props.mode === 'Query') {
      return (
        <div className={classnames(styles['export-to-lang-modal-checkbox-builders'])}>
          <Checkbox defaultChecked={this.props.builders}
            data-testid="export-to-lang-checkbox-builders"
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
        onShow={this.showHandler}
        data-testid="export-to-lang-modal"
        className={classnames(
          // Because this modal is rendered outside of the react root
          // we need to apply the deprecated bootstrap styles here.
          'with-global-bootstrap-styles',
          styles['export-to-lang-modal']
        )}
      >
        <Modal.Header>
          <Modal.Title data-testid="export-to-lang-modal-title">
            {`Export ${this.props.mode} To Language`}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body data-testid="export-to-lang-modal-body">
          <ExportForm {...this.props} copySuccessChanged={this.copySuccessChanged} from={this.props.mode === 'Query' ? this.props.inputExpression.filter : this.props.inputExpression.aggregation}/>
          <div className={classnames(styles['export-to-lang-modal-checkbox-imports'])}>
            <Checkbox data-testid="export-to-lang-checkbox-imports" onClick={this.importsHandler} defaultChecked={this.props.showImports}>
               Include Import Statements
            </Checkbox>
          </div>
          <div className={classnames(styles['export-to-lang-modal-checkbox-driver'])}>
            <Checkbox data-testid="export-to-lang-checkbox-driver" onClick={this.driverHandler} defaultChecked={this.props.driver}>
              Include Driver Syntax
            </Checkbox>
          </div>
          {this.renderBuilderCheckbox()}
        </Modal.Body>

        <Modal.Footer>
          <TextButton
            data-testid="export-to-lang-close"
            className="btn btn-default btn-sm"
            text="Close"
            clickHandler={this.closeHandler} />
        </Modal.Footer>
      </Modal>
    );
  }
}

export default ExportModal;
