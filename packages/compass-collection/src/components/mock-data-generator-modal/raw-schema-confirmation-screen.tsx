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
import type { CollectionState } from '../../modules/collection-tab';
import type { SchemaAnalysisState } from '../../schema-analysis-types';
import type { MockDataGeneratorState } from './types';
import HadronDocument from 'hadron-document';

interface RawSchemaConfirmationScreenProps {
  schemaAnalysis: SchemaAnalysisState;
  fakerSchemaGenerationStatus: MockDataGeneratorState['status'];
}

const documentContainerStyles = css({
  backgroundColor: palette.gray.light3,
  border: `1px solid ${palette.gray.light2}`,
  borderRadius: spacing[400],
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
          progressText="Generating mock data mappings..."
        />
      </div>
    );
  }

  return (
    <div data-testid="raw-schema-confirmation">
      {schemaAnalysis.status === 'complete' ? (
        <>
          <Body className={descriptionStyles}>
            We&apos;ll use the identified schema to generate a mock data script
            for your collection. You can customize the script and its{' '}
            <Link
              href="https://fakerjs.dev/api/"
              target="_blank"
              hideExternalIcon
            >
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
                  <Body weight="medium">
                    Enable Sending Sample Field Values
                  </Body>
                  <Body>
                    To improve mock data quality Project Owners can enable
                    sending sample field values to the AI model. Refresh Data
                    Explorer for changes to take effect.
                  </Body>
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
                  PROJECT SETTINGS
                </Button>
              </div>
            </Banner>
          )}
          {fakerSchemaGenerationStatus === 'error' && (
            <Banner
              variant={BannerVariant.Danger}
              className={bannerStyles}
              data-testid="error-banner"
            >
              LLM Request failed. Please confirm again.
            </Banner>
          )}
        </>
      ) : (
        // Not reachable since schema analysis must be finished before the modal can be opened
        <Body>We are analyzing your collection.</Body>
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
