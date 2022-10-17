import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { FormModal } from '@mongodb-js/compass-components';
import { Editor, EditorVariant } from '@mongodb-js/compass-editor';

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
      <FormModal
        title={TITLE}
        open={this.props.isOpen}
        onSubmit={this.props.createNew}
        onCancel={this.props.closeImport}
        submitButtonText="Create New"
        submitDisabled={this.props.text === ''}
        trackingId="import_pipeline_modal"
        data-testid="import-pipeline-modal"
      >
        <div className={styles['import-pipeline-note']}>{NOTE}</div>
        <div className={styles['import-pipeline-editor']}>
          <Editor
            variant={EditorVariant.Shell}
            text={this.props.text}
            onChangeText={this.props.changeText}
            options={{ minLines: 10 }}
            name="import-pipeline-editor"
          />
        </div>
        {this.renderError()}
      </FormModal>
    );
  }
}

export default ImportPipeline;
