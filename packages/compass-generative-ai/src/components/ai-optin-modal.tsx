import React, { useEffect, useCallback } from 'react';
import { connect } from 'react-redux';
import {
  Banner,
  Body,
  Link,
  MarketingModal,
  css,
  spacing,
  palette,
  useDarkMode,
  SpinLoader,
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

const disclaimerStyles = css({
  color: palette.gray.dark1,
  paddingLeft: spacing[800],
  paddingRight: spacing[800],
});

// TODO: The LG MarketingModal does not provide a way to disable a button
// so this is a temporary workaround to make the button look disabled.
const disableOptInButtonStyles = css({
  button: {
    opacity: 0.5,
    pointerEvents: 'none',
    cursor: 'not-allowed',
  },
});

const getButtonText = ({
  isOptInInProgress,
  isCloudOptIn,
  darkMode,
}: {
  isOptInInProgress: boolean;
  isCloudOptIn: boolean;
  darkMode: boolean | undefined;
}) => {
  return (
    <>
      Opt-in AI features
      {isOptInInProgress && isCloudOptIn && (
        <>
          &nbsp;
          <SpinLoader darkMode={darkMode}></SpinLoader>
        </>
      )}
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
  const track = useTelemetry();
  const darkMode = useDarkMode();
  const PROJECT_SETTINGS_LINK = projectId
    ? window.location.origin + '/v2/' + projectId + '#/settings/groupSettings'
    : null;

  useEffect(() => {
    if (isOptInModalVisible) {
      track('AI Opt In Modal Shown', {});
    }
  }, [isOptInModalVisible, track]);

  const onConfirmClick = () => {
    if ((isOptInInProgress && isCloudOptIn) || !isProjectAIEnabled) {
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
      open={true}
      onClose={handleModalClose}
      className={isCloudOptIn ? disableOptInButtonStyles : undefined}
      onButtonClick={onConfirmClick}
      title="Opt-in Gen AI-Powered features"
      // @ts-expect-error - buttonText expects a string but supports ReactNode as well.
      buttonText={getButtonText({
        isOptInInProgress,
        isCloudOptIn,
        darkMode,
      })}
      linkText="Not now"
      onLinkClick={handleModalClose}
      graphic={<AiImageBanner />}
      darkMode={darkMode}
      disclaimer={
        <div className={disclaimerStyles}>
          This is a feature powered by generative AI, and may give inaccurate
          responses. Please see our{' '}
          <Link hideExternalIcon={false} href={GEN_AI_FAQ_LINK} target="_blank">
            FAQ
          </Link>{' '}
          for more information.
        </div>
      }
    >
      <Body
        style={{
          textAlign: 'left',
          marginTop: spacing[300],
        }}
      >
        Opt in now MongoDB’s intelligent AI-powered features:
        <ul
          style={{
            textAlign: 'left',
            marginTop: spacing[100],
            listStyle: 'disc',
          }}
        >
          <li>AI Assistant allows you to ask questions across connections</li>
          <li>Natural Language Bar to create queries and aggregations</li>
          {/* <li>Mock Data Generator to create AI powered sample data</li> */}
        </ul>
        {isCloudOptIn && (
          <Banner
            data-testid="ai-optin-cloud-banner"
            variant={isProjectAIEnabled ? 'info' : 'warning'}
            style={{ marginTop: spacing[300] }}
          >
            {isProjectAIEnabled
              ? 'AI features are enabled for project users with data access.'
              : 'AI features are disabled for project users.'}{' '}
            Project Owners can {isProjectAIEnabled ? 'disable' : 'enable'} Data
            Explorer AI features in the{' '}
            {PROJECT_SETTINGS_LINK !== null ? (
              <Link href={PROJECT_SETTINGS_LINK} target="_blank">
                Project Settings
              </Link>
            ) : (
              'Project Settings'
            )}
            .
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
