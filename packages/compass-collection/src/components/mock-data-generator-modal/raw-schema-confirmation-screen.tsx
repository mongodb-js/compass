import React, { useState } from 'react';
import { connect } from 'react-redux';

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
import {
  openMockDataGeneratorSettings,
  analyzeCollectionSchema,
} from '../../modules/collection-tab';
import type { CollectionState } from '../../modules/collection-tab';
import type { SchemaAnalysisState } from '../../schema-analysis-types';
import type { MockDataGeneratorState } from './types';
import HadronDocument from 'hadron-document';
import { FAKER_API_LINK } from './constants';

interface RawSchemaConfirmationScreenProps {
  schemaAnalysis: SchemaAnalysisState;
  fakerSchemaGenerationStatus: MockDataGeneratorState['status'];
  onOpenSettings: () => void;
  onRetryAnalysis: () => void;
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
  onOpenSettings,
  onRetryAnalysis,
}: RawSchemaConfirmationScreenProps) => {
  const enableSampleDocumentPassing = usePreference(
    'enableGenAISampleDocumentPassing'
  );
  const isDarkMode = useDarkMode();
  const connectionInfo = useConnectionInfo();
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);

  // Atlas metadata is only present for compass-web connections
  const isAtlas = !!connectionInfo.atlasMetadata;
  const projectId = connectionInfo.atlasMetadata?.projectId;
  const projectSettingsUrl = projectId
    ? `${window.location.origin}/v2/${projectId}#/settings/groupSettings`
    : null;

  // Show sample values banner when:
  // - Sample document passing is NOT enabled
  // - Either it's Atlas with a project ID to link to settings, or desktop
  // - User hasn't dismissed the banner
  const shouldShowSampleValuesBanner =
    !enableSampleDocumentPassing &&
    (isAtlas ? !!projectId : true) &&
    !isBannerDismissed;

  // Show loading state when LLM request is in progress
  if (fakerSchemaGenerationStatus === 'in-progress') {
    return (
      <div
        data-testid="raw-schema-confirmation"
        className={loaderContainerStyles}
      >
        <SpinLoaderWithLabel
          data-testid="raw-schema-confirmation-loader"
          progressText="Generating mock data mappings..."
        />
      </div>
    );
  }

  if (schemaAnalysis.status === 'error') {
    return (
      <div data-testid="raw-schema-confirmation">
        <Banner
          variant={BannerVariant.Danger}
          data-testid="schema-analysis-error-banner"
        >
          <div className={bannerContentStyles}>
            <div className={bannerTextStyles}>
              <Body weight="medium">Schema Analysis Failed</Body>
              <Body>{schemaAnalysis.error.errorMessage}</Body>
              {schemaAnalysis.error.errorType === 'empty' && (
                <Body>
                  Insert or import some documents into this collection, then
                  retry.
                </Body>
              )}
            </div>
            <Button
              size="xsmall"
              onClick={onRetryAnalysis}
              data-testid="retry-analysis-button"
            >
              Retry
            </Button>
          </div>
        </Banner>
      </div>
    );
  }

  if (schemaAnalysis.status !== 'complete') {
    return (
      <div
        data-testid="raw-schema-confirmation"
        className={loaderContainerStyles}
      >
        <SpinLoaderWithLabel
          data-testid="raw-schema-confirmation-loader"
          progressText="Analyzing collection..."
        />
      </div>
    );
  }

  return (
    <div data-testid="raw-schema-confirmation">
      <Body className={descriptionStyles}>
        We&apos;ll use the identified schema and AI to generate a mock data
        script for your collection. You can customize the script and its{' '}
        <Link href={FAKER_API_LINK} target="_blank" hideExternalIcon>
          Faker functions
        </Link>{' '}
        before running it and/or reuse it for your other clusters and
        collections.
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
              <Body weight="medium">Enable Sending Sample Field Values</Body>
              {isAtlas ? (
                <Body>
                  To improve mock data quality, Project Owners can enable
                  sending sample field values to the AI model. Refresh Data
                  Explorer for changes to take effect.
                </Body>
              ) : (
                <Body>
                  To improve mock data quality, enable sending sample field
                  values in Settings → Artificial Intelligence.
                </Body>
              )}
            </div>
            {isAtlas ? (
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
                Project Settings
              </Button>
            ) : (
              <Button
                size="xsmall"
                onClick={onOpenSettings}
                data-testid="sample-values-banner-settings-button"
              >
                Open Settings
              </Button>
            )}
          </div>
        </Banner>
      )}
      {fakerSchemaGenerationStatus === 'error' && (
        <Banner
          variant={BannerVariant.Warning}
          className={bannerStyles}
          data-testid="error-banner"
        >
          LLM Request failed. Please confirm again.
        </Banner>
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

const ConnectedRawSchemaConfirmationScreen = connect(mapStateToProps, {
  onOpenSettings: openMockDataGeneratorSettings,
  onRetryAnalysis: analyzeCollectionSchema,
})(RawSchemaConfirmationScreen);

export default ConnectedRawSchemaConfirmationScreen;
