import React, { useState } from 'react';
import { connect } from 'react-redux';
import { Trans, useTranslation } from 'react-i18next';

import {
  css,
  palette,
  spacing,
  Banner,
  BannerVariant,
  Body,
  Button,
  DocumentList,
  useDarkMode,
  cx,
  Link,
  SpinLoaderWithLabel,
} from '@mongodb-js/compass-components';

import { usePreference } from 'compass-preferences-model/provider';
import { useConnectionInfo } from '@mongodb-js/compass-connections/provider';
import toSimplifiedFieldInfo from './to-simplified-field-info';
import type { CollectionState } from '../../modules/collection-tab';
import type { SchemaAnalysisState } from '../../schema-analysis-types';
import type { MockDataGeneratorState } from './types';
import HadronDocument from 'hadron-document';
import { FAKER_API_LINK } from './constants';

interface RawSchemaConfirmationScreenProps {
  schemaAnalysis: SchemaAnalysisState;
  fakerSchemaGenerationStatus: MockDataGeneratorState['status'];
}

const documentContainerStyles = css({
  backgroundColor: palette.gray.light3,
  border: `1px solid ${palette.gray.light2}`,
  borderRadius: spacing[400],
  minHeight: '100px',
  maxHeight: '300px',
  overflow: 'auto',
});
const documentContainerDarkStyles = css({
  backgroundColor: palette.gray.dark3,
  border: `1px solid ${palette.gray.dark2}`,
  borderRadius: spacing[400],
});

const documentStyles = css({
  padding: `${spacing[400]}px ${spacing[900]}px`,
});

const descriptionStyles = css({
  marginBottom: spacing[400],
});

const bannerStyles = css({
  marginTop: spacing[400],
});

const bannerContentStyles = css({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-end',
  gap: spacing[300],
});

const bannerTextStyles = css({
  flex: 1,
});

const loaderContainerStyles = css({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
});

const RawSchemaConfirmationScreen = ({
  schemaAnalysis,
  fakerSchemaGenerationStatus,
}: RawSchemaConfirmationScreenProps) => {
  const { t } = useTranslation('compassCollection');
  const enableSampleDocumentPassing = usePreference(
    'enableGenAISampleDocumentPassing'
  );
  const isDarkMode = useDarkMode();
  const connectionInfo = useConnectionInfo();
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);

  const projectId = connectionInfo.atlasMetadata?.projectId;
  const projectSettingsUrl = projectId
    ? `${window.location.origin}/v2/${projectId}#/settings/groupSettings`
    : null;

  // Show sample values banner when:
  // - Sample document passing is NOT enabled
  // - Project ID is available (so we can link to settings)
  // - User hasn't dismissed the banner
  const shouldShowSampleValuesBanner =
    !enableSampleDocumentPassing && projectId && !isBannerDismissed;

  // Show loading state when LLM request is in progress
  if (fakerSchemaGenerationStatus === 'in-progress') {
    return (
      <div
        data-testid="raw-schema-confirmation"
        className={loaderContainerStyles}
      >
        <SpinLoaderWithLabel
          data-testid="raw-schema-confirmation-loader"
          progressText={t('generatingMappingsText')}
        />
      </div>
    );
  }

  return (
    <div data-testid="raw-schema-confirmation">
      {schemaAnalysis.status === 'complete' ? (
        <>
          <Body className={descriptionStyles}>
            <Trans
              i18nKey="schemaDescriptionText"
              ns="compassCollection"
              components={{
                fakerLink: (
                  <Link
                    href={FAKER_API_LINK}
                    target="_blank"
                    hideExternalIcon
                  />
                ),
              }}
            />
          </Body>
          <div
            className={cx(
              documentContainerStyles,
              isDarkMode && documentContainerDarkStyles
            )}
          >
            <DocumentList.Document
              className={documentStyles}
              editable={false}
              value={
                new HadronDocument(
                  enableSampleDocumentPassing
                    ? schemaAnalysis.sampleDocument
                    : toSimplifiedFieldInfo(schemaAnalysis.processedSchema)
                )
              }
            />
          </div>
          {shouldShowSampleValuesBanner && (
            <Banner
              variant={BannerVariant.Info}
              className={bannerStyles}
              dismissible
              onClose={() => setIsBannerDismissed(true)}
              data-testid="sample-values-banner"
            >
              <div className={bannerContentStyles}>
                <div className={bannerTextStyles}>
                  <Body weight="medium">{t('enableSampleValuesTitle')}</Body>
                  <Body>{t('enableSampleValuesBody')}</Body>
                </div>
                <Button
                  size="xsmall"
                  onClick={() => {
                    if (projectSettingsUrl) {
                      window.open(
                        projectSettingsUrl,
                        '_blank',
                        'noopener noreferrer'
                      );
                    }
                  }}
                  data-testid="sample-values-banner-settings-button"
                >
                  {t('projectSettingsButton')}
                </Button>
              </div>
            </Banner>
          )}
          {fakerSchemaGenerationStatus === 'error' && (
            <Banner
              variant={BannerVariant.Warning}
              className={bannerStyles}
              data-testid="error-banner"
            >
              {t('llmRequestFailed')}
            </Banner>
          )}
        </>
      ) : (
        // Not reachable since schema analysis must be finished before the modal can be opened
        <Body>{t('analyzingCollection')}</Body>
      )}
    </div>
  );
};

const mapStateToProps = (state: CollectionState) => {
  const schemaAnalysis = state.schemaAnalysis;
  const fakerSchemaGenerationStatus = state.fakerSchemaGeneration.status;

  return {
    schemaAnalysis,
    fakerSchemaGenerationStatus,
  };
};

const ConnectedRawSchemaConfirmationScreen = connect(
  mapStateToProps,
  {}
)(RawSchemaConfirmationScreen);

export default ConnectedRawSchemaConfirmationScreen;
