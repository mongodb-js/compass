import React, { useEffect, useCallback } from 'react';
import { connect } from 'react-redux';
import type { Theme } from '@mongodb-js/compass-components';
import {
  Banner,
  Body,
  Link,
  css,
  spacing,
  palette,
  Themes,
  useDarkMode,
  MarketingModal,
  cx,
} from '@mongodb-js/compass-components';
import { AiImageBanner } from './ai-image-banner';
import { closeOptInModal, optIn } from '../store/atlas-optin-reducer';
import type { RootState } from '../store/atlas-ai-store';
import { usePreference } from 'compass-preferences-model/provider';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';

const GEN_AI_FAQ_LINK = 'https://www.mongodb.com/docs/generative-ai-faq/';

type OptInModalProps = {
  isOptInModalVisible: boolean;
  isOptInInProgress: boolean;
  isCloudOptIn: boolean;
  onOptInModalClose: () => void;
  onOptInClick: () => void;
  projectId?: string;
};

const bodyStyles = css({
  marginTop: spacing[400],
  marginLeft: spacing[300],
  marginRight: spacing[300],
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
});

const bodyLightThemeStyles = css({
  color: palette.gray.dark1,
});

const bodyDarkThemeStyles = css({
  color: palette.gray.light2,
});

const disclaimerStylesCommon = {
  marginTop: spacing[400],
  marginLeft: spacing[800],
  marginRight: spacing[800],
  textAlign: 'center',
};

const disclaimerStyles = {
  [Themes.Light]: css({
    color: palette.gray.dark1,
    ...disclaimerStylesCommon,
  }),
  [Themes.Dark]: css({
    color: palette.gray.light2,
    ...disclaimerStylesCommon,
  }),
};

const bannerStyles = css({
  width: '480px',
  padding: spacing[400],
  marginTop: spacing[400],
  textAlign: 'left',
});

// TODO: The LG MarketingModal does not provide a way to disable the button
// so this is a temporary workaround to make the button look disabled.
const leafyGreenButtonSelector =
  'button[data-lgid="lg-button"]:not([aria-label="Close modal"])';
const focusSelector = `&:focus-visible, &[data-focus="true"]`;
const hoverSelector = `&:hover, &[data-hover="true"]`;
const activeSelector = `&:active, &[data-active="true"]`;
const focusBoxShadow = (color: string) => `
    0 0 0 2px ${color}, 
    0 0 0 4px ${palette.blue.light1};
`;
const disabledButtonStyles: Record<Theme, string> = {
  [Themes.Light]: css({
    [leafyGreenButtonSelector]: {
      [`&, ${hoverSelector}, ${activeSelector}`]: {
        backgroundColor: palette.gray.light2,
        borderColor: palette.gray.light1,
        color: palette.gray.base,
        boxShadow: 'none',
        cursor: 'not-allowed',
      },

      [focusSelector]: {
        color: palette.gray.base,
        boxShadow: focusBoxShadow(palette.white),
      },
    },
  }),

  [Themes.Dark]: css({
    [leafyGreenButtonSelector]: {
      [`&, ${hoverSelector}, ${activeSelector}`]: {
        backgroundColor: palette.gray.dark3,
        borderColor: palette.gray.dark2,
        color: palette.gray.dark1,
        boxShadow: 'none',
        cursor: 'not-allowed',
      },

      [focusSelector]: {
        color: palette.gray.dark1,
        boxShadow: focusBoxShadow(palette.black),
      },
    },
  }),
};

const CloudAIOptInBannerContent: React.FunctionComponent<{
  isProjectAIEnabled: boolean;
  isSampleDocumentPassingEnabled: boolean;
  projectId?: string;
}> = ({ isProjectAIEnabled, isSampleDocumentPassingEnabled, projectId }) => {
  const projectSettingsLink = projectId ? (
    <Link
      href={
        window.location.origin + '/v2/' + projectId + '#/settings/groupSettings'
      }
      target="_blank"
      hideExternalIcon
    >
      Project Settings
    </Link>
  ) : (
    'Project Settings'
  );
  if (!isProjectAIEnabled) {
    // Both disabled case (main AI features disabled)
    return (
      <>
        AI features are disabled for project users with data access. Project
        Owners can enable Data Explorer AI features in {projectSettingsLink}.
      </>
    );
  } else if (!isSampleDocumentPassingEnabled) {
    // Only sample values disabled case
    return (
      <>
        AI features are enabled for project users with data access. Project
        Owners can disable these features or enable sending sample field values
        in Data Explorer AI features to improve their accuracy in{' '}
        {projectSettingsLink}.
      </>
    );
  }
  return (
    <>
      AI features are enabled for project users with data access. Project Owners
      can disable Data Explorer AI features in {projectSettingsLink}.
    </>
  );
};

export const AIOptInModal: React.FunctionComponent<OptInModalProps> = ({
  isOptInModalVisible,
  isOptInInProgress,
  isCloudOptIn,
  onOptInModalClose,
  onOptInClick,
  projectId,
}) => {
  const isProjectAIEnabled = usePreference('enableGenAIFeaturesAtlasProject');
  const isSampleDocumentPassingEnabled = usePreference(
    'enableGenAISampleDocumentPassing'
  );
  const track = useTelemetry();
  const darkMode = useDarkMode();
  const currentDisabledButtonStyles =
    disabledButtonStyles[darkMode ? Themes.Dark : Themes.Light];

  useEffect(() => {
    if (isOptInModalVisible) {
      track('AI Opt In Modal Shown', {});
    }
  }, [isOptInModalVisible, track]);

  const onConfirmClick = () => {
    if (isOptInInProgress || !isProjectAIEnabled) {
      return;
    }
    onOptInClick();
  };

  const handleModalClose = useCallback(() => {
    track('AI Opt In Modal Dismissed' as const, {});
    onOptInModalClose();
  }, [track, onOptInModalClose]);

  return (
    <MarketingModal
      showBlob
      blobPosition="top right"
      title={`Use AI Features in ${isCloudOptIn ? 'Data Explorer' : 'Compass'}`}
      open={isOptInModalVisible}
      onClose={handleModalClose}
      data-testid="ai-optin-modal"
      // TODO Button Disabling
      className={!isProjectAIEnabled ? currentDisabledButtonStyles : undefined}
      buttonProps={{
        children: 'Use AI Features',
        onClick: onConfirmClick,
      }}
      linkText="Not now"
      onLinkClick={onOptInModalClose}
      graphic={<AiImageBanner />}
      disclaimer={
        <div
          className={disclaimerStyles[darkMode ? Themes.Dark : Themes.Light]}
        >
          Features in {isCloudOptIn ? 'Data Explorer' : 'Compass'} powered by
          generative AI may produce inaccurate responses. Please see our{' '}
          <Link hideExternalIcon={false} href={GEN_AI_FAQ_LINK} target="_blank">
            FAQ
          </Link>{' '}
          for more information. Continue to opt into all AI-powered features
          within {isCloudOptIn ? 'Data Explorer' : 'Compass'}.
        </div>
      }
    >
      <Body
        className={cx(
          bodyStyles,
          darkMode ? bodyDarkThemeStyles : bodyLightThemeStyles
        )}
      >
        AI-powered features in {isCloudOptIn ? 'Data Explorer' : 'Compass'}{' '}
        supply users with an intelligent toolset to build faster and smarter
        with MongoDB.
        {isCloudOptIn && (
          <Banner
            data-testid="ai-optin-cloud-banner"
            variant={isProjectAIEnabled ? 'info' : 'warning'}
            className={bannerStyles}
          >
            <CloudAIOptInBannerContent
              isProjectAIEnabled={isProjectAIEnabled}
              isSampleDocumentPassingEnabled={isSampleDocumentPassingEnabled}
              projectId={projectId}
            />
          </Banner>
        )}
      </Body>
    </MarketingModal>
  );
};

export default connect(
  (state: RootState) => {
    return {
      isOptInModalVisible: state.optIn.isModalOpen,
      isOptInInProgress: state.optIn.state === 'in-progress',
    };
  },
  { onOptInModalClose: closeOptInModal, onOptInClick: optIn }
)(AIOptInModal);
