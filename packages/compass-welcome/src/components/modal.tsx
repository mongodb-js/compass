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
import { Trans, useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('compassWelcome');

  return (
    <MarketingModal
      data-testid="welcome-modal"
      open={isOpen}
      onClose={onClose}
      buttonProps={{ onClick: onClose, children: t('modalStart') }}
      title={t('modalTitle')}
      showBlob
      blobPosition="top right"
      disclaimer={
        networkTraffic ? (
          <div className={disclaimer}>
            {t('modalDisclaimerPrivacy')}
            <br />
            <Trans
              i18nKey="modalDisclaimerSettings"
              ns="compassWelcome"
              components={{
                settingsLink: (
                  <Link
                    data-testid="open-settings-link"
                    hideExternalIcon
                    className={link}
                    onClick={onOpenSettingsClick}
                  />
                ),
              }}
            />
          </div>
        ) : undefined
      }
      graphic={<WelcomeModalImage width={156} height={209} />}
      linkText={''}
      darkMode={darkMode}
    >
      <Body>{t('modalBody')}</Body>
    </MarketingModal>
  );
};

export default connect(
  (state: WelcomeModalState) => {
    return { isOpen: state.isOpen };
  },
  { onClose: closeModal, onOpenSettingsClick: openSettings }
)(WelcomeModal);
