import React, { useEffect, useCallback } from 'react';
import { connect } from 'react-redux';
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
  useTranslation,
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

function withLink(template: string, link: React.ReactNode): React.ReactNode {
  const [before, after] = template.split('{link}');
  return (
    <>
      {before}
      {link}
      {after}
    </>
  );
}

const CloudAIOptInBannerContent: React.FunctionComponent<{
  isProjectAIEnabled: boolean;
  isSampleDocumentPassingEnabled: boolean;
  projectId?: string;
}> = ({ isProjectAIEnabled, isSampleDocumentPassingEnabled, projectId }) => {
  const t = useTranslation();
  const projectSettingsLabel = t(
    'genai.optin.projectSettings',
    'Project Settings'
  );
  const projectSettingsLink = projectId ? (
    <Link
      href={
        window.location.origin + '/v2/' + projectId + '#/settings/groupSettings'
      }
      target="_blank"
      hideExternalIcon
    >
      {projectSettingsLabel}
    </Link>
  ) : (
    projectSettingsLabel
  );
  if (!isProjectAIEnabled) {
    // Both disabled case (main AI features disabled)
    return withLink(
      t(
        'genai.optin.cloudDisabled',
        'AI features are disabled for project users with data access. Project Owners can enable Data Explorer AI features in {link}.'
      ),
      projectSettingsLink
    );
  } else if (!isSampleDocumentPassingEnabled) {
    // Only sample values disabled case
    return withLink(
      t(
        'genai.optin.cloudSamplesDisabled',
        'AI features are enabled for project users with data access. Project Owners can disable these features or enable sending sample field values in Data Explorer AI features to improve their accuracy in {link}.'
      ),
      projectSettingsLink
    );
  }
  return withLink(
    t(
      'genai.optin.cloudEnabled',
      'AI features are enabled for project users with data access. Project Owners can disable Data Explorer AI features in {link}.'
    ),
    projectSettingsLink
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
  const t = useTranslation();
  const product = isCloudOptIn ? 'Data Explorer' : 'Compass';

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
      title={t('genai.optin.title', 'Use AI Features in {product}', {
        product,
      })}
      open={isOptInModalVisible}
      onClose={handleModalClose}
      data-testid="ai-optin-modal"
      buttonProps={{
        children: t('genai.optin.useAiFeatures', 'Use AI Features'),
        onClick: onConfirmClick,
        disabled: !isProjectAIEnabled,
      }}
      linkText={t('genai.optin.notNow', 'Not now')}
      onLinkClick={onOptInModalClose}
      graphic={<AiImageBanner />}
      disclaimer={
        <div
          className={disclaimerStyles[darkMode ? Themes.Dark : Themes.Light]}
        >
          {t(
            'genai.optin.disclaimerBefore',
            'Features in {product} powered by generative AI may produce inaccurate responses. Please see our',
            { product }
          )}{' '}
          <Link hideExternalIcon={false} href={GEN_AI_FAQ_LINK} target="_blank">
            {t('genai.optin.faq', 'FAQ')}
          </Link>{' '}
          {t(
            'genai.optin.disclaimerAfter',
            'for more information. Continue to opt into all AI-powered features within {product}.',
            { product }
          )}
        </div>
      }
    >
      <Body
        className={cx(
          bodyStyles,
          darkMode ? bodyDarkThemeStyles : bodyLightThemeStyles
        )}
      >
        {t(
          'genai.optin.description',
          'AI-powered features in {product} supply users with an intelligent toolset to build faster and smarter with MongoDB.',
          { product }
        )}
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
