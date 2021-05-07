import { TextButton } from 'hadron-react-buttons';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { Modal } from 'react-bootstrap';
import { connect } from 'react-redux';

import { SET_SHOW_INFO_MODAL } from '../../modules/info-modal';

import styles from './info-modal.less';

const hotkeys = [
  {
    key: 'Ctrl+A',
    description: 'Moves the cursor to the begining of the line.'
  },
  {
    key: 'Ctrl+B',
    description: 'Moves the cursor backwards one character.'
  },
  {
    key: 'Ctrl+C',
    description: 'Stop currently running command.'
  },
  {
    key: 'Ctrl+D',
    description: 'Erases the next character.'
  },
  {
    key: 'Ctrl+E',
    description: 'Moves the cursor to the end of the line.'
  },
  {
    key: 'Ctrl+F',
    description: 'Moves the cursor forwards one character.'
  },
  {
    key: 'Ctrl+H',
    description: 'Erases one character. Similar to hitting backspace.'
  },
  {
    key: 'Ctrl+L',
    description: 'Clears the screen, similar to the clear command.'
  },
  {
    key: 'Ctrl+T',
    description: 'Swap the last two characters before the cursor.'
  },
  {
    key: 'Ctrl+U',
    description: 'Changes the line to uppercase.'
  }
];

/**
 * Show information on how to use the shell in compass.
 */
export class InfoModal extends PureComponent {
  static propTypes = {
    hideInfoModal: PropTypes.func.isRequired,
    isInfoModalVisible: PropTypes.bool.isRequired
  };

  /**
   * Render the component.
   *
   * @returns {React.Component} The component.
   */
  render() {
    const {
      hideInfoModal,
      isInfoModalVisible
    } = this.props;

    return (
      <Modal show={isInfoModalVisible}>
        <Modal.Header closeButton onHide={hideInfoModal}>
          <h4>MongoSH Beta</h4>
        </Modal.Header>
        <Modal.Body>
          <div className={styles['info-modal-banner']}>
            More information on this release of&nbsp;
            <a
              className={styles['info-modal-banner-link']}
              id="mongosh-info-link"
              rel="noreopener"
              href="https://docs.mongodb.com/compass/beta/embedded-shell/"
              target="_blank"
            >MongoSH Beta</a>
          </div>
          <div className={styles['info-modal-shortcuts-title']}>
            Keyboard Shortcuts
          </div>
          <div className={styles['info-modal-shortcuts']}>
            {hotkeys.map(shortcut => (
              <div
                className={styles['info-modal-shortcuts-hotkey']}
                key={`short-cut-${shortcut.key}`}
              >
                <span
                  className={styles['info-modal-shortcuts-hotkey-key']}
                >{shortcut.key}</span>{shortcut.description}
              </div>
            ))}
            <div className={styles['info-modal-shortcuts-hotkey']}>
              <span
                className={styles['info-modal-shortcuts-hotkey-key']}
              >&uarr;</span>Cycle backwards through command history.
            </div>
            <div className={styles['info-modal-shortcuts-hotkey']}>
              <span
                className={styles['info-modal-shortcuts-hotkey-key']}
              >&darr;</span>Cycle forwards through command history.
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <TextButton
            id="close-info-modal"
            className="btn btn-default btn-sm"
            text="Close"
            clickHandler={hideInfoModal}
          />
        </Modal.Footer>
      </Modal>
    );
  }
}

export default connect(
  (state) => ({
    isInfoModalVisible: state.infoModal.isInfoModalVisible
  }),
  (dispatch) => ({
    hideInfoModal: () => dispatch({
      type: SET_SHOW_INFO_MODAL,
      isInfoModalVisible: false
    })
  })
)(InfoModal);
