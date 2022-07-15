import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Editor, EditorVariant, ConfirmationModal } from '@mongodb-js/compass-components';

import styles from './import-pipeline.module.less';

/**
 * Title.
 */
const TITLE = 'New Pipeline From Plain Text';

/**
 * Note.
 */
const NOTE = 'Supports MongoDB Shell syntax. Pasting a pipeline will create a new pipeline.';

/**
 * Import pipeline modal.
 */
class ImportPipeline extends PureComponent {
  static displayName = 'ImportPipelineComponent';

  static propTypes = {
    isOpen: PropTypes.bool.isRequired,
    closeImport: PropTypes.func.isRequired,
    changeText: PropTypes.func.isRequired,
    createNew: PropTypes.func.isRequired,
    text: PropTypes.string.isRequired,
    error: PropTypes.string
  }

  /**
   * Render the error message.
   *
   * @returns {Component} The component.
   */
  renderError() {
    if (this.props.error) {
      return (
        <div className={styles['import-pipeline-error']}>
          {this.props.error}
        </div>
      );
    }
  }

  /**
   * Render the component.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <ConfirmationModal
        title={TITLE}
        open={this.props.isOpen}
        onConfirm={this.props.createNew}
        onCancel={this.props.closeImport}
        buttonText="Create New"
        submitDisabled={this.props.text === ''}
        trackingId="import_pipeline_modal"
      >
        <div className={styles['import-pipeline-note']}>
          {NOTE}
        </div>
        <div className={styles['import-pipeline-editor']}>
          <Editor
            variant={EditorVariant.Shell}
            text={this.props.text}
            onChangeText={this.props.changeText}
            options={({minLines: 10})}
            name="import-pipeline-editor"
          />
        </div>
        {this.renderError()}
      </ConfirmationModal>
    );
  }
}

export default ImportPipeline;
