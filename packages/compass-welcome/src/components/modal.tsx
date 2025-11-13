import React from 'react';
import { connect } from 'react-redux';
import {
  MarketingModal,
  Body,
  Link,
  css,
  spacing,
  useDarkMode,
} from '@mongodb-js/compass-components';
import { usePreference } from 'compass-preferences-model/provider';
import type { WelcomeModalState } from '../stores/welcome-modal-store';
import { closeModal, openSettings } from '../stores/welcome-modal-store';
import { WelcomeModalImage } from './welcome-image';

const disclaimer = css({
  padding: `0 ${spacing[900]}px`,
});

const link = css({
  fontSize: 'inherit',
});

type WelcomeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettingsClick: () => void;
};

export const WelcomeModal: React.FunctionComponent<WelcomeModalProps> = ({
  isOpen,
  onClose,
  onOpenSettingsClick,
}) => {
  const networkTraffic = usePreference('networkTraffic');
  const darkMode = useDarkMode();

  return (
    <MarketingModal
      data-testid="welcome-modal"
      open={isOpen}
      onClose={onClose}
      onButtonClick={onClose}
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
              onClick={onOpenSettingsClick}
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

export default connect(
  (state: WelcomeModalState) => {
    return { isOpen: state.isOpen };
  },
  { onClose: closeModal, onOpenSettingsClick: openSettings }
)(WelcomeModal);
