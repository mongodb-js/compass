import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { Modal } from 'react-bootstrap';
import AceEditor from 'react-ace';
import { TextButton } from 'hadron-react-buttons';

import 'brace/ext/language_tools';
import 'mongodb-ace-mode';
import 'mongodb-ace-theme';

import styles from './import-pipeline.less';

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
    text: PropTypes.string.isRequired
  }

  /**
   * Render the component.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <Modal show={this.props.isOpen} onHide={this.props.closeImport}>
        <Modal.Header closeButton>
          <h4>{TITLE}</h4>
        </Modal.Header>
        <Modal.Body>
          <div className={classnames(styles['import-pipeline-note'])}>
            {NOTE}
          </div>
          <div className={classnames(styles['import-pipeline-editor'])}>
            <AceEditor
              mode="mongodb"
              theme="mongodb"
              width="100%"
              value={this.props.text}
              onChange={this.props.changeText}
              editorProps={{ $blockScrolling: Infinity }}
              name="import-pipeline-editor"
              setOptions={OPTIONS} />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <TextButton
            id="cancel-import-pipeline-from-text"
            className="btn btn-default btn-sm"
            text="Cancel"
            clickHandler={this.props.closeImport} />
          <TextButton
            id="import-pipeline-from-text"
            className="btn btn-primary btn-sm"
            text="Create New"
            disabled={this.props.text === ''}
            clickHandler={this.props.createNew} />
        </Modal.Footer>
      </Modal>
    );
  }
}

export default ImportPipeline;
