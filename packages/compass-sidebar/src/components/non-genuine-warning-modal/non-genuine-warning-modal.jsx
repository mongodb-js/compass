/* eslint react/sort-comp:0 */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Modal } from 'react-bootstrap';
import { TextButton } from 'hadron-react-buttons';
import FontAwesome from 'react-fontawesome';

import classnames from 'classnames';
import styles from './non-genuine-warning-modal.less';

/**
 * The help URL for collation.
 */
const P1 = 'Some documented MongoDB features may work differently, be entirely missing'
  + 'or incomplete, or have unexpected performance characteristics. ';
const WARNING_BANNER = 'This server or service appears to be an emulation of MongoDB rather than an official MongoDB product.';
export const LEARN_MORE_URL = 'https://docs.mongodb.com/compass/master/faq/#how-does-compass-determine-a-connection-is-not-genuine';
export const MODAL_TITLE = 'Non-Genuine MongoDB Detected';

/**
 * Component for the non-genuine MongoDB warning modal.
 */
class NonGenuineWarningModal extends PureComponent {
  static displayName = 'NonGenuineWarningModal';
  static propTypes = {
    isVisible: PropTypes.bool.isRequired,
    toggleIsVisible: PropTypes.func.isRequired,
    openLink: PropTypes.func.isRequired
  };

  /**
   * Close modal.
   *
   * @param {Object} evt - The click event.
   */
  handleClose(evt) {
    if (evt) {
      evt.preventDefault();
      evt.stopPropagation();
    }
    this.props.toggleIsVisible(false);
  }

  /**
   * Render the non-genuine mongodb warning modal.
   *
   * @returns {React.Component} The non-genuine warning modal.
   */
  render() {
    return (
      <Modal show={this.props.isVisible}
        backdrop="static"
        dialogClassName={classnames(styles['non-genuine-warning-modal'])}
        onHide={this.handleClose.bind(this)} >

        <Modal.Header>
          <Modal.Title>{MODAL_TITLE}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div className={classnames(styles['non-genuine-warning-modal-message'])}>
            <FontAwesome name="exclamation-circle"/>
            &nbsp; {WARNING_BANNER} &nbsp;
          </div>

          <div className={classnames(styles['non-genuine-warning-modal-p1'])}>
            {P1}
            <a
              onClick={() => this.props.openLink(LEARN_MORE_URL)}
              data-test-id="non-genuine-warning-modal-learn-more-link">
              Learn more
            </a>&nbsp;
          </div>
        </Modal.Body>

        <Modal.Footer>
          <TextButton
            className="btn btn-primary btn-sm"
            dataTestId="continue-button"
            text="CONTINUE"
            clickHandler={this.handleClose.bind(this)} />
        </Modal.Footer>
      </Modal>
    );
  }
}

export default NonGenuineWarningModal;
