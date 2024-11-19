import React from 'react';
import { connect } from 'react-redux';
import {
  Banner,
  Body,
  Link,
  ConfirmationModal,
  SpinLoader,
  css,
  spacing,
  H3,
  palette,
} from '@mongodb-js/compass-components';
import { AISignInImageBanner } from './ai-signin-banner-image';
import { closeOptInModal, optIn } from '../store/atlas-optin-reducer';
import type { RootState } from '../store/atlas-ai-store';
import { usePreference } from 'compass-preferences-model/provider';

const GEN_AI_FAQ_LINK = 'https://www.mongodb.com/docs/generative-ai-faq/';

type OptInModalProps = {
  isOptInModalVisible: boolean;
  isOptInInProgress: boolean;
  onOptInModalClose: () => void;
  onOptInClick: () => void;
  projectId: string;
};

const titleStyles = css({
  marginBottom: spacing[400],
  marginTop: spacing[400],
  marginLeft: spacing[500],
  marginRight: spacing[500],
  textAlign: 'center',
});

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

const disclaimer = css({
  color: palette.gray.dark1,
  marginTop: spacing[400],
  marginLeft: spacing[800],
  marginRight: spacing[800],
});

const banner = css({
  padding: spacing[400],
  marginTop: spacing[400],
  textAlign: 'left',
});

const featureStatusBannerVariant = (pIsOrgAiEnabled: boolean) => {
  switch (true) {
    case pIsOrgAiEnabled:
      return 'info';
    default:
      return 'warning';
  }
};

function getFeatureStatusBannerText(pIsOrgAiEnabled: boolean) {
  switch (true) {
    case pIsOrgAiEnabled:
      return 'AI features are enabled for project users with data access.';

    default:
      return 'AI features are disabled for project users.';
  }
}

const AIOptInModal: React.FunctionComponent<OptInModalProps> = ({
  isOptInModalVisible,
  isOptInInProgress,
  onOptInModalClose,
  onOptInClick,
  projectId,
}) => {
  const isOrgAiEnabled = usePreference('enableGenAIFeaturesAtlasProject');
  const PROJECT_SETTINGS_LINK =
    window.location.origin + '/v2/' + projectId + '#/settings/groupSettings';

  return (
    <ConfirmationModal
      open={isOptInModalVisible}
      onClose={onOptInModalClose}
      title=""
      // @ts-expect-error leafygreen only allows strings, but we need to pass icons
      buttonText={
        <>
          &nbsp;Use Natural Language
          {isOptInInProgress && (
            <>
              &nbsp;
              <SpinLoader darkMode={true}></SpinLoader>
            </>
          )}
        </>
      }
      submitDisabled={!isOrgAiEnabled}
      onConfirm={() => {
        if (isOptInInProgress) {
          return;
        }
        onOptInClick();
      }}
      onCancel={onOptInModalClose}
    >
      <Body className={bodyStyles}>
        <AISignInImageBanner></AISignInImageBanner>
        <H3 className={titleStyles}>
          Use natural language to generate queries and pipelines
        </H3>
        Atlas users can now quickly create queries and aggregations with
        MongoDB&apos;s&nbsp; intelligent AI-powered feature, available today.
        <Banner
          variant={featureStatusBannerVariant(isOrgAiEnabled)}
          className={banner}
        >
          {getFeatureStatusBannerText(isOrgAiEnabled)} Project Owners can change
          this setting in the{' '}
          <Link href={PROJECT_SETTINGS_LINK} target="_blank">
            AI features
          </Link>
          section.
        </Banner>
        <div className={disclaimer}>
          This is a feature powered by generative AI, and may give inaccurate
          responses. Please see our{' '}
          <Link hideExternalIcon={false} href={GEN_AI_FAQ_LINK} target="_blank">
            FAQ
          </Link>{' '}
          for more information.
        </div>
      </Body>
    </ConfirmationModal>
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
