import React, { useEffect, useRef, useState } from 'react';
import {
  Body,
  Code,
  H3,
  Link,
  Modal,
  spacing,
  css,
} from '@mongodb-js/compass-components';

import ConnectingAnimation from './connecting-animation';
import ConnectingIllustration from './connecting-illustration';
import ConnectingBackground from './connecting-background';

// We delay showing the modal for this amount of time to avoid flashing.
const showModalDelayMS = 250;

const modalContentStyles = css({
  textAlign: 'center',
  padding: spacing[3],
  paddingBottom: spacing[5] + spacing[2],
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
  marginTop: spacing[4],
});

const textContentStyles = css({
  marginTop: spacing[3],
});

const oidcContainerStyles = css({
  padding: `0px ${spacing[4]}px`,
});

/**
 * Modal shown when attempting to connect.
 */
function Connecting({
  connectingStatusText,
  onCancelConnectionClicked,
  oidcDeviceAuthVerificationUrl,
  oidcDeviceAuthUserCode,
}: {
  connectingStatusText: string;
  onCancelConnectionClicked: () => void;
  oidcDeviceAuthVerificationUrl: string | null;
  oidcDeviceAuthUserCode: string | null;
}): React.ReactElement {
  const [showModal, setShowModal] = useState(false);
  const showModalDebounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  useEffect(() => {
    if (showModalDebounceTimeout.current === null && !showModal) {
      showModalDebounceTimeout.current = setTimeout(() => {
        setShowModal(true);
        showModalDebounceTimeout.current = null;
      }, showModalDelayMS);
    }

    return () => {
      if (showModalDebounceTimeout.current) {
        clearTimeout(showModalDebounceTimeout.current);
        showModalDebounceTimeout.current = null;
      }
    };
  }, [showModal]);

  return (
    <React.Fragment>
      <ConnectingBackground />
      <Modal open={showModal} setOpen={() => onCancelConnectionClicked()}>
        <div
          data-testid="connecting-modal-content"
          className={modalContentStyles}
          id="connectingStatusText"
        >
          <ConnectingIllustration />
          {oidcDeviceAuthVerificationUrl && oidcDeviceAuthUserCode ? (
            <div className={oidcContainerStyles}>
              <Body className={textContentStyles}>
                Visit the following URL to complete authentication:
              </Body>
              <Link href={oidcDeviceAuthVerificationUrl} target="_blank">
                {oidcDeviceAuthVerificationUrl}
              </Link>
              <Body className={textContentStyles}>
                Enter the following code on that page:
              </Body>
              <Code language="none" copyable>
                {oidcDeviceAuthUserCode}
              </Code>
            </div>
          ) : (
            <>
              <H3 className={connectingStatusStyles}>{connectingStatusText}</H3>
              <ConnectingAnimation />
            </>
          )}
          <Link
            as="button"
            data-testid="cancel-connection-button"
            onClick={onCancelConnectionClicked}
            hideExternalIcon
            className={cancelButtonStyles}
          >
            Cancel
          </Link>
        </div>
      </Modal>
    </React.Fragment>
  );
}

export default Connecting;
