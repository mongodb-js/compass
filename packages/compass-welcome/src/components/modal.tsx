import React from 'react';
import { connect } from 'react-redux';
import {
  MarketingModal,
  Body,
  Link,
  css,
  spacing,
  useDarkMode,
  useTranslation,
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
  const t = useTranslation();
  const networkTraffic = usePreference('networkTraffic');
  const darkMode = useDarkMode();

  return (
    <MarketingModal
      data-testid="welcome-modal"
      open={isOpen}
      onClose={onClose}
      buttonProps={{
        onClick: onClose,
        children: t('welcome.modal.start', 'Start'),
      }}
      title={t('welcome.modal.title', 'Welcome to Compass')}
      showBlob
      blobPosition="top right"
      disclaimer={
        networkTraffic ? (
          <div className={disclaimer}>
            {t(
              'welcome.modal.disclaimer',
              "To help improve our products, anonymous usage data is collected and sent to MongoDB in accordance with MongoDB's privacy policy."
            )}
            <br />
            {t(
              'welcome.modal.manageBefore',
              'Manage this behaviour on the Compass'
            )}{' '}
            <Link
              data-testid="open-settings-link"
              hideExternalIcon
              className={link}
              onClick={onOpenSettingsClick}
            >
              {t('welcome.modal.settings', 'Settings')}
            </Link>{' '}
            {t('welcome.modal.manageAfter', 'page.')}
          </div>
        ) : undefined
      }
      graphic={<WelcomeModalImage width={156} height={209} />}
      linkText={''}
      darkMode={darkMode}
    >
      <Body>
        {t(
          'welcome.modal.body',
          'Build aggregation pipelines, optimize queries, analyze schemas, and more. All with the GUI built by - and for - MongoDB.'
        )}
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
