import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Modal } from 'react-bootstrap';

class ImportPipeline extends PureComponent {
  static displayName = 'ImportPipelineComponent';

  static propTypes = {
    isOpen: PropTypes.bool.isRequired
  }

  onClose = () => {

  }

  /**
   * Render the component.
   *
   * @returns {React.Component} The component.
   */
  render() {
    return (
      <Modal show={this.props.isOpen} onHide={this.onClose}>
        <Modal.Header closeButton>
          Import Pipeline
        </Modal.Header>
        <Modal.Body>
        </Modal.Body>
        <Modal.Footer>
        </Modal.Footer>
      </Modal>
    );
  }
}

export default ImportPipeline;
