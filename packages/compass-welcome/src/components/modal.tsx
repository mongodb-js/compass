import React, { useCallback, useEffect, useState } from 'react';
import ipc, { ipcRenderer } from 'hadron-ipc';

import {
  MarketingModal,
  Body,
  Disclaimer,
  Link,
  css,
  spacing,
} from '@mongodb-js/compass-components';

import welcomeImagePath from '../images/welcome.png';

const disclaimer = css({
  marginTop: spacing[3],
});

const link = css({
  fontSize: 'inherit',
});

const WelcomeModal: React.FunctionComponent = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    (ipc as any).on('window:show-welcome', () => {
      setIsOpen(true);
    });
  }, [setIsOpen]);

  const closeModal = useCallback(() => setIsOpen(false), []);

  const goToSettings = useCallback(() => {
    closeModal();
    ipcRenderer.emit('window:show-network-optin');
  }, [closeModal]);

  return (
    <MarketingModal
      open={isOpen}
      onClose={closeModal}
      onButtonClick={closeModal}
      title="Welcome to Compass"
      buttonText="Start"
      showBlob
      blobPosition="top right"
      graphic={
        <img src={welcomeImagePath} alt="welcome" width={293} height={209} />
      }
      linkText={''}
    >
      <Body>
        Build aggregation pipelines, optimize queries, analyze schemas,
        and&nbsp;more. All with the GUI built by - and for - MongoDB.
      </Body>
      <Disclaimer className={disclaimer}>
        To help improve our products, anonymous usage data is collected and sent
        to MongoDB in accordance with MongoDB&apos;s privacy policy.
        <br />
        Manage this behaviour on the Compass{' '}
        <Link hideExternalIcon className={link} onClick={goToSettings}>
          Settings
        </Link>{' '}
        page.
      </Disclaimer>
    </MarketingModal>
  );
};

export default WelcomeModal;
