import React, { useEffect, useCallback } from 'react';
import { connect } from 'react-redux';
import {
  Banner,
  Body,
  Link,
  css,
  spacing,
  palette,
} from '@mongodb-js/compass-components';
// eslint-disable-next-line @mongodb-js/compass/no-leafygreen-outside-compass-components
import MarketingModal from '@leafygreen-ui/marketing-modal';
import { AiImageBanner } from './ai-image-banner';
import { closeOptInModal, optIn } from '../store/atlas-optin-reducer';
import type { RootState } from '../store/atlas-ai-store';
import { usePreference } from 'compass-preferences-model/provider';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';

const GEN_AI_FAQ_LINK = 'https://www.mongodb.com/docs/generative-ai-faq/';

type OptInModalProps = {
  isOptInModalVisible: boolean;
  isOptInInProgress: boolean;
  onOptInModalClose: () => void;
  onOptInClick: () => void;
  projectId?: string;
};

const bodyStyles = css({
  marginBottom: spacing[400],
  marginTop: spacing[400],
  marginLeft: spacing[300],
  marginRight: spacing[300],
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
});

const disclaimerStyles = css({
  color: palette.gray.dark1,
  marginTop: spacing[400],
  marginLeft: spacing[800],
  marginRight: spacing[800],
});

const bannerStyles = css({
  padding: spacing[400],
  marginTop: spacing[400],
  textAlign: 'left',
});

export const AIOptInModal: React.FunctionComponent<OptInModalProps> = ({
  isOptInModalVisible,
  isOptInInProgress,
  onOptInModalClose,
  onOptInClick,
  projectId,
}) => {
  const isProjectAIEnabled = usePreference('enableGenAIFeaturesAtlasProject');
  const isSampleDocumentPassingEnabled = usePreference(
    'enableGenAISampleDocumentPassingOnAtlasProject'
  );
  const track = useTelemetry();
  const PROJECT_SETTINGS_LINK = projectId
    ? window.location.origin + '/v2/' + projectId + '#/settings/groupSettings'
    : null;

  useEffect(() => {
    if (isOptInModalVisible) {
      track('AI Opt In Modal Shown', {});
    }
  }, [isOptInModalVisible, track]);

  const onConfirmClick = () => {
    if (isOptInInProgress) {
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
      title="Use AI Features in Data Explorer"
      open={isOptInModalVisible}
      onClose={handleModalClose}
      buttonProps={{
        children: 'Use AI Features',
        onClick: onConfirmClick,
        disabled: !isProjectAIEnabled,
      }}
      linkText="Not now"
      onLinkClick={onOptInModalClose}
      graphic={<AiImageBanner />}
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
      <Body className={bodyStyles}>
        AI-powered features in Data Explorer supply users with an intelligent
        toolset to build faster and smarter with MongoDB.
        <Banner
          variant={isProjectAIEnabled ? 'info' : 'warning'}
          className={bannerStyles}
        >
          {(() => {
            if (!isProjectAIEnabled) {
              // Both disabled case (main AI features disabled)
              return (
                <>
                  AI features are disabled for project users with data access.
                  Project Owners can enable Data Explorer AI features in{' '}
                  {PROJECT_SETTINGS_LINK !== null ? (
                    <Link href={PROJECT_SETTINGS_LINK} target="_blank">
                      Project Settings
                    </Link>
                  ) : (
                    'Project Settings'
                  )}
                  .
                </>
              );
            } else if (!isSampleDocumentPassingEnabled) {
              // Only sample values disabled case
              return (
                <>
                  AI features are enabled for project users with data access.
                  Project Owners can disable these features or enable sending
                  sample field values in Data Explorer AI features to improve
                  their accuracy in{' '}
                  {PROJECT_SETTINGS_LINK !== null ? (
                    <Link href={PROJECT_SETTINGS_LINK} target="_blank">
                      Project Settings
                    </Link>
                  ) : (
                    'Project Settings'
                  )}
                  .
                </>
              );
            } else {
              // Both enabled case
              return (
                <>
                  AI features are enabled for project users with data access.
                  Project Owners can disable Data Explorer AI features in{' '}
                  {PROJECT_SETTINGS_LINK !== null ? (
                    <Link href={PROJECT_SETTINGS_LINK} target="_blank">
                      Project Settings
                    </Link>
                  ) : (
                    'Project Settings'
                  )}
                  .
                </>
              );
            }
          })()}
        </Banner>
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
