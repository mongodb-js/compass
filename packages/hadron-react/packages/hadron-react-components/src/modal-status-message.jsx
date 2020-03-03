import React from 'react';
import PropTypes from 'prop-types';
import { Panel } from 'react-bootstrap';

/**
 * Component for the status message.
 */
class ModalStatusMessage extends React.Component {

  /**
   * Render the status message.
   *
   * @returns {React.Component} The status message component.
   */
  render() {
    // prefix for class names for css styling
    const classPrefix = `modal-status-${this.props.type}`;
    return (
      <Panel className={classPrefix}>
        <div className="row">
          <div className="col-md-1">
            <i
              className={`fa fa-${this.props.icon} ${classPrefix}-icon`}
              aria-hidden="true"></i>
          </div>
          <div className="col-md-11">
            <p
              className={`${classPrefix}-message`} data-test-id="modal-message">
              {this.props.message}
            </p>
          </div>
        </div>
      </Panel>
    );
  }
}

ModalStatusMessage.displayName = 'ModalStatusMessage';

ModalStatusMessage.propTypes = {
  icon: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired
};

export default ModalStatusMessage;
