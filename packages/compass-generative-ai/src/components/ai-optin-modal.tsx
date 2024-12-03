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
import { AiImageBanner } from './ai-image-banner';
import { closeOptInModal, optIn } from '../store/atlas-optin-reducer';
import type { RootState } from '../store/atlas-ai-store';
import { usePreference } from 'compass-preferences-model/provider';

const GEN_AI_FAQ_LINK = 'https://www.mongodb.com/docs/generative-ai-faq/';

type OptInModalProps = {
  isOptInModalVisible: boolean;
  isOptInInProgress: boolean;
  onOptInModalClose: () => void;
  onOptInClick: () => void;
  projectId?: string;
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
const getButtonText = (isOptInInProgress: boolean) => {
  return (
    <>
      &nbsp;Use Natural Language
      {isOptInInProgress && (
        <>
          &nbsp;
          <SpinLoader darkMode={true}></SpinLoader>
        </>
      )}
    </>
  );
};

export const AIOptInModal: React.FunctionComponent<OptInModalProps> = ({
  isOptInModalVisible,
  isOptInInProgress,
  onOptInModalClose,
  onOptInClick,
  projectId,
}) => {
  const isProjectAIEnabled = usePreference('enableGenAIFeaturesAtlasProject');
  const PROJECT_SETTINGS_LINK = projectId
    ? window.location.origin + '/v2/' + projectId + '#/settings/groupSettings'
    : null;

  const onConfirmClick = () => {
    if (isOptInInProgress) {
      return;
    }
    onOptInClick();
  };
  return (
    <ConfirmationModal
      open={isOptInModalVisible}
      title=""
      confirmButtonProps={{
        children: getButtonText(isOptInInProgress),
        disabled: !isProjectAIEnabled,
        onClick: onConfirmClick,
      }}
      cancelButtonProps={{
        onClick: onOptInModalClose,
      }}
    >
      <Body className={bodyStyles}>
        <AiImageBanner></AiImageBanner>
        <H3 className={titleStyles}>
          Use natural language to generate queries and pipelines
        </H3>
        Atlas users can now quickly create queries and aggregations with
        MongoDB&apos;s&nbsp; intelligent AI-powered feature, available today.
        <Banner
          variant={isProjectAIEnabled ? 'info' : 'warning'}
          className={bannerStyles}
        >
          {isProjectAIEnabled
            ? 'AI features are enabled for project users with data access.'
            : 'AI features are disabled for project users.'}{' '}
          Project Owners can change this setting in the{' '}
          {PROJECT_SETTINGS_LINK !== null ? (
            <Link href={PROJECT_SETTINGS_LINK} target="_blank">
              AI features
            </Link>
          ) : (
            'AI features '
          )}
          section.
        </Banner>
        <div className={disclaimerStyles}>
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
