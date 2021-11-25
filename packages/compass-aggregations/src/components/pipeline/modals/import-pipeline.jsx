import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { ConfirmationModal } from '@mongodb-js/compass-components';

import 'ace-builds';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/ext-language_tools';
import 'mongodb-ace-mode';
import 'mongodb-ace-theme';

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
 * Options for the ACE editor.
 */
const OPTIONS = {
  enableLiveAutocompletion: false,
  tabSize: 2,
  fontSize: 11,
  minLines: 10,
  maxLines: Infinity,
  showGutter: true,
  useWorker: false
};

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
          <AceEditor
            mode="mongodb"
            theme="mongodb"
            width="100%"
            value={this.props.text}
            onChange={this.props.changeText}
            editorProps={{ $blockScrolling: Infinity }}
            name="import-pipeline-editor"
            setOptions={OPTIONS}
          />
        </div>
        {this.renderError()}
      </ConfirmationModal>
    );
  }
}

export default ImportPipeline;
