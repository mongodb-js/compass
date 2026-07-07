import React, { useEffect } from 'react';

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
  useSearchActivationProgramP2,
  useTelemetry,
} from '@mongodb-js/compass-telemetry/provider';
import { useConnectionInfo } from '@mongodb-js/compass-connections/provider';
import { buildProjectSettingsUrl } from '@mongodb-js/atlas-service/provider';
import { useAssistantActions } from '@mongodb-js/compass-assistant';
import {
  isSearchIndexDefinitionError,
  isRerankNotEnabledError,
  getVoyageProjectRateLimitInfo,
  type SearchExtensionType,
} from '../utils/search-stage-errors';
import RateLimitExceededBanner from './rate-limit-exceeded-banner';
const bannerButtonStyles = css({
  flexShrink: 0,
  whiteSpace: 'nowrap',
});

const RERANK_DOCS_URL =
  'https://dochub.mongodb.org/core/manage-native-reranking';

const bannerStyles = css({
  textAlign: 'left',
});

const bannerContentStyles = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: spacing[200],
});

type ServerErrorBannerProps = {
  message: string;
  searchIndexName: string | null;
  onEditSearchIndexClick?: (indexName: string) => void;
  searchExtensionType?: SearchExtensionType | null;
  dataTestId?: string;
  stageOperator?: string | null;
  stageValue?: string | null;
  onCloseFocusMode?: () => void;
};

export default function ServerErrorBanner({
  message,
  searchIndexName,
  onEditSearchIndexClick,
  searchExtensionType,
  dataTestId = 'server-error-banner',
  stageOperator,
  stageValue,
  onCloseFocusMode,
}: ServerErrorBannerProps) {
  const { enableSearchActivationProgramP1 } = useSearchActivationProgramP1();
  const { enableSearchActivationProgramP2 } = useSearchActivationProgramP2();
  const { openDrawer } = useDrawerActions();
  const track = useTelemetry();
  const { atlasMetadata } = useConnectionInfo();
  const { debugSearchError } = useAssistantActions();
  const rerankNotEnabled = isRerankNotEnabledError(message);

  useEffect(() => {
    if (rerankNotEnabled) {
      track('Rerank Not Enabled Banner Shown', {
        context: 'Rerank Not Enabled Banner',
      });
    }
  }, [rerankNotEnabled, track]);

  const projectSettingsHref = rerankNotEnabled
    ? atlasMetadata
      ? buildProjectSettingsUrl({
          projectId: atlasMetadata.projectId,
          params: { highlight: 'nativeReranking' },
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

  const showEditSearchIndexLink =
    enableSearchActivationProgramP1 &&
    !!searchIndexName &&
    isSearchIndexDefinitionError(message) &&
    !!onEditSearchIndexClick;

  const onDebugClick =
    !showEditSearchIndexLink &&
    enableSearchActivationProgramP2 &&
    debugSearchError &&
    stageOperator === '$search' &&
    stageValue
      ? () => {
          onCloseFocusMode?.();
          debugSearchError({
            stageOperator,
            errorMessage: message,
            stageValue,
          });
        }
      : undefined;

  return (
    <Banner variant="danger" data-testid={dataTestId} className={bannerStyles}>
      {rerankNotEnabled ? (
        <>
          <strong>$rerank not enabled</strong>
          <br />
          <div className={bannerContentStyles}>
            <span>Enable native reranking in project settings.</span>
            {projectSettingsHref && (
              <Button
                size="xsmall"
                onClick={() => {
                  track('Rerank Project Settings Button Clicked', {
                    context: 'Rerank Not Enabled Banner',
                  });
                  window.open(
                    projectSettingsHref,
                    '_blank',
                    'noopener noreferrer'
                  );
                }}
                rightGlyph={<Icon glyph="OpenNewTab" />}
                className={bannerButtonStyles}
              >
                Project Settings
              </Button>
            )}
          </div>
        </>
      ) : (
        <div className={bannerContentStyles}>
          <span>
            {message}
            {showEditSearchIndexLink && (
              <>
                {' '}
                <Link
                  onClick={() => {
                    track('Search Index Edit Link Clicked', {
                      context: 'Server Error Banner',
                    });
                    openDrawer('compass-indexes-drawer');
                    onEditSearchIndexClick?.(searchIndexName ?? '');
                  }}
                >
                  Edit Search Index
                </Link>
              </>
            )}
          </span>
          {onDebugClick && (
            <Button
              size="xsmall"
              variant="primaryOutline"
              onClick={onDebugClick}
              // TODO(COMPASS-9751): Will be replaced with Sparkle gradient icon once Leafygreen components are updated.
              leftGlyph={<Icon glyph="Sparkle" />}
              data-testid="server-error-banner-debug-button"
            >
              Debug
            </Button>
          )}
        </div>
      )}
    </Banner>
  );
}
