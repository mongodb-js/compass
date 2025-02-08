import React, { useCallback } from 'react';

import {
  MarketingModal,
  Body,
  Link,
  css,
  spacing,
  useDarkMode,
} from '@mongodb-js/compass-components';
import { withPreferences } from 'compass-preferences-model/provider';

import { WelcomeModalImage } from './welcome-image';

const disclaimer = css({
  padding: `0 ${spacing[900]}px`,
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
  const darkMode = useDarkMode();
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
      disclaimer={
        networkTraffic ? (
          <div className={disclaimer}>
            To help improve our products, anonymous usage data is collected and
            sent to MongoDB in accordance with MongoDB&apos;s privacy policy.
            <br />
            Manage this behaviour on the Compass{' '}
            <Link
              data-testid="open-settings-link"
              hideExternalIcon
              className={link}
              onClick={goToSettings}
            >
              Settings
            </Link>{' '}
            page.
          </div>
        ) : undefined
      }
      graphic={<WelcomeModalImage width={156} height={209} />}
      linkText={''}
      darkMode={darkMode}
    >
      <Body>
        Build aggregation pipelines, optimize queries, analyze schemas,
        and&nbsp;more. All with the GUI built by - and for - MongoDB.
      </Body>
    </MarketingModal>
  );
};

export default withPreferences(WelcomeModal, ['networkTraffic']);
