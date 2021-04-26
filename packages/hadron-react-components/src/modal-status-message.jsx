import PropTypes from 'prop-types';
import React from 'react';
import { Panel } from 'react-bootstrap';

/**
 * Component for the status message.
 */
class ModalStatusMessage extends React.Component {
  /**
   * Called when the icon of the message is clicked.
   * @param {Event} evt
   */
  onIconClickHandler(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    this.props.onIconClickHandler();
  }

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
            {this.props.onIconClickHandler
              ? (
                <i
                  className={`fa fa-${this.props.icon} ${classPrefix}-icon ${classPrefix}-icon-interactible`}
                  onClick={this.onIconClickHandler.bind(this)} />
              ) : (
                <i
                  className={`fa fa-${this.props.icon} ${classPrefix}-icon`}
                  aria-hidden="true" />
              )}
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
  type: PropTypes.string.isRequired,
  onIconClickHandler: PropTypes.func
};

export default ModalStatusMessage;
