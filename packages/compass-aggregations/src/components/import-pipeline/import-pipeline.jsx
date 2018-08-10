import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { Modal } from 'react-bootstrap';

import styles from './import-pipeline.less';

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
    closeImport: PropTypes.func.isRequired
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
          <h4>New Pipeline From Plain Text</h4>
        </Modal.Header>
        <Modal.Body>
          <div className={classnames(styles['import-pipeline-note'])}>
            {NOTE}
          </div>
        </Modal.Body>
        <Modal.Footer>
        </Modal.Footer>
      </Modal>
    );
  }
}

export default ImportPipeline;
