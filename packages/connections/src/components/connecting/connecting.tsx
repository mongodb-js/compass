import { css } from '@emotion/css';
import { H2, Link, Modal, spacing } from '@mongodb-js/compass-components';
import React, { useEffect, useRef, useState } from 'react';
// import { Modal } from 'react-bootstrap';

import ConnectingAnimation from './connecting-animation';
// import Actions from '../../actions';
import Illustration from '../../assets/svg/connecting-illustration.svg';
// import styles from '../connect.module.less';
import { ConnectionAttempt } from '../../modules/connection-attempt';
import ConnectingBackground from './connecting-background';

// We delay showing the modal for this amount of time to avoid flashing.
const showModalDelayMS = 250;

const modalContentStyles = css({
  textAlign: 'center',
  padding: spacing[3],
});

const illustrationStyles = css({
  maxHeight: '40vh',
});

const connectingStatusStyles = css({
  marginTop: spacing[3],
  fontWeight: 'bold',
  maxHeight: 100,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

const cancelButtonStyles = css({
  border: 'none',
  background: 'none',
  padding: 0,
  margin: 0,
  marginTop: spacing[3],
});

/**
 * Modal shown when attempting to connect.
 */
function Connecting({
  connectingStatusText,
  connectionAttempt,
  onCancelConnectionClicked,
}: {
  connectingStatusText: string;
  connectionAttempt: ConnectionAttempt | null;
  onCancelConnectionClicked: () => void;
}): React.ReactElement {
  const [showModal, setShowModal] = useState(false);
  const showModalDebounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  useEffect(() => {
    if (
      connectionAttempt &&
      showModalDebounceTimeout.current === null &&
      !showModal
    ) {
      showModalDebounceTimeout.current = setTimeout(() => {
        if (connectionAttempt && !connectionAttempt.isClosed()) {
          setShowModal(true);
        }
        showModalDebounceTimeout.current = null;
      }, showModalDelayMS);
    }

    if (!connectionAttempt && showModal) {
      setShowModal(false);
    }

    return () => {
      if (showModalDebounceTimeout.current) {
        clearTimeout(showModalDebounceTimeout.current);
        showModalDebounceTimeout.current = null;
      }
    };
  }, [connectionAttempt, showModal]);

  return (
    <React.Fragment>
      {!!connectionAttempt && <ConnectingBackground />}
      <Modal
        // animation={false}
        // show={showModal && !!connectionAttempt}
        // backdropClassName={styles['connecting-modal-backdrop']}
        // ^^ todo

        open={showModal && !!connectionAttempt}
        setOpen={() => onCancelConnectionClicked()}
        // closeOnBackdropClick={false}
      >
        {/* <Modal.Body> */}
        <div
          data-test-id="connecting-modal-content"
          className={modalContentStyles}
          id="connectingStatusText"
        >
          <img
            className={illustrationStyles}
            src={Illustration}
            alt="Compass connecting illustration"
          />
          <H2 className={connectingStatusStyles}>{connectingStatusText}</H2>
          <ConnectingAnimation />
          <Link
            as="button"
            data-test-id="cancel-connection-button"
            onClick={onCancelConnectionClicked}
            hideExternalIcon
            className={cancelButtonStyles}
          >
            Cancel
          </Link>
        </div>
        {/* </Modal.Body> */}
      </Modal>
    </React.Fragment>
  );
}

export default Connecting;
