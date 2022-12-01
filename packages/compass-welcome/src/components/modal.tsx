import React, { useCallback } from 'react';

import {
  MarketingModal,
  Body,
  Disclaimer,
  Link,
  css,
  spacing,
} from '@mongodb-js/compass-components';
import { withPreferences } from 'compass-preferences-model';

import WelcomeImage from './welcome-image';

const disclaimer = css({
  marginTop: spacing[3],
});

const link = css({
  fontSize: 'inherit',
});

type WelcomeModalProps = {
  networkTraffic: boolean;
  isOpen: boolean;
  closeModal: (openSettings?: boolean) => void;
};

export const WelcomeModal: React.FunctionComponent<WelcomeModalProps> = ({
  networkTraffic,
  isOpen,
  closeModal,
}) => {
  const goToSettings = useCallback(() => {
    closeModal(true);
  }, [closeModal]);

  const close = useCallback(() => {
    closeModal();
  }, [closeModal]);

  return (
    <MarketingModal
      data-testid="welcome-modal"
      open={isOpen}
      onClose={close}
      onButtonClick={close}
      title="Welcome to Compass"
      buttonText="Start"
      showBlob
      blobPosition="top right"
      graphic={<WelcomeImage width={156} height={209} />}
      linkText={''}
    >
      <Body>
        Build aggregation pipelines, optimize queries, analyze schemas,
        and&nbsp;more. All with the GUI built by - and for - MongoDB.
      </Body>
      {networkTraffic && (
        <Disclaimer className={disclaimer}>
          To help improve our products, anonymous usage data is collected and
          sent to MongoDB in accordance with MongoDB&apos;s privacy policy.
          <br />
          Manage this behaviour on the Compass{' '}
          <Link hideExternalIcon className={link} onClick={goToSettings}>
            Settings
          </Link>{' '}
          page.
        </Disclaimer>
      )}
    </MarketingModal>
  );
};

export default withPreferences(WelcomeModal, ['networkTraffic'], React);
