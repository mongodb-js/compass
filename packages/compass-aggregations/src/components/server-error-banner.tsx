import React from 'react';

import {
  Banner,
  Button,
  Icon,
  Link,
  css,
  spacing,
  useDrawerActions,
} from '@mongodb-js/compass-components';
import {
  useSearchActivationProgramP1,
  useTelemetry,
} from '@mongodb-js/compass-telemetry/provider';
import { useConnectionInfo } from '@mongodb-js/compass-connections/provider';
import { buildProjectSettingsUrl } from '@mongodb-js/atlas-service/provider';
import {
  isSearchIndexDefinitionError,
  isRerankNotEnabledError,
  getVoyageProjectRateLimitInfo,
  type SearchExtensionType,
} from '../utils/search-stage-errors';
import RateLimitExceededBanner from './rate-limit-exceeded-banner';
import { bannerButtonStyles } from './banner-button-styles';

const RERANK_DOCS_URL =
  'https://www.mongodb.com/docs/vector-search/query/aggregation-stages/rerank/#navigate-to-the-project-settings-page';

const bannerStyles = css({
  textAlign: 'left',
});

const bannerContentStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[200],
});

type ServerErrorBannerProps = {
  message: string;
  searchIndexName: string | null;
  onEditSearchIndexClick?: (indexName: string) => void;
  searchExtensionType?: SearchExtensionType | null;
  dataTestId?: string;
};

export default function ServerErrorBanner({
  message,
  searchIndexName,
  onEditSearchIndexClick,
  searchExtensionType,
  dataTestId = 'server-error-banner',
}: ServerErrorBannerProps) {
  const { enableSearchActivationProgramP1 } = useSearchActivationProgramP1();
  const { openDrawer } = useDrawerActions();
  const track = useTelemetry();
  const { atlasMetadata } = useConnectionInfo();
  const rerankNotEnabled = isRerankNotEnabledError(message);
  const projectSettingsHref = rerankNotEnabled
    ? atlasMetadata
      ? buildProjectSettingsUrl({
          projectId: atlasMetadata.projectId,
          highlight: 'nativeReranking',
        })
      : RERANK_DOCS_URL
    : null;

  const rateLimitInfo = getVoyageProjectRateLimitInfo(message);
  if (rateLimitInfo) {
    return (
      <RateLimitExceededBanner
        rateLimitInfo={rateLimitInfo}
        searchExtensionType={searchExtensionType}
        dataTestId={dataTestId}
      />
    );
  }

  return (
    <Banner variant="danger" data-testid={dataTestId} className={bannerStyles}>
      {rerankNotEnabled ? (
        <>
          <strong>Native reranking not enabled</strong>
          <br />
          <div className={bannerContentStyles}>
            <span>Enable native reranking in project settings.</span>
            {projectSettingsHref && (
              <Button
                size="xsmall"
                onClick={() =>
                  window.open(
                    projectSettingsHref,
                    '_blank',
                    'noopener noreferrer'
                  )
                }
                rightGlyph={<Icon glyph="OpenNewTab" />}
                className={bannerButtonStyles}
              >
                Project Settings
              </Button>
            )}
          </div>
        </>
      ) : (
        message
      )}
      {enableSearchActivationProgramP1 &&
        searchIndexName &&
        isSearchIndexDefinitionError(message) &&
        onEditSearchIndexClick && (
          <>
            {' '}
            <Link
              onClick={() => {
                track('Search Index Edit Link Clicked', {
                  context: 'Server Error Banner',
                });
                openDrawer('compass-indexes-drawer');
                onEditSearchIndexClick(searchIndexName);
              }}
            >
              Edit Search Index
            </Link>
          </>
        )}
    </Banner>
  );
}
