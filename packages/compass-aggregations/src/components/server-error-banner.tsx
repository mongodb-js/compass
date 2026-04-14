import React from 'react';

import {
  css,
  cx,
  spacing,
  Link,
  Banner,
  Button,
  Icon,
  useDrawerActions,
} from '@mongodb-js/compass-components';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';
import { useConnectionInfo } from '@mongodb-js/compass-connections/provider';
import { buildProjectSettingsUrl } from '@mongodb-js/atlas-service/provider';
import {
  isSearchIndexDefinitionError,
  isRerankNotEnabledError,
} from '../utils/search-stage-errors';

const bannerStyles = css({
  flex: 'none',
  marginTop: spacing[200],
  marginLeft: spacing[200],
  marginRight: spacing[200],
  textAlign: 'left',
});

const bannerContentStyles = css({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
});

type ServerErrorBannerProps = {
  message: string;
  searchIndexName: string | null;
  onEditSearchIndexClick?: (indexName: string) => void;
  dataTestId?: string;
  className?: string;
};

export default function ServerErrorBanner({
  message,
  searchIndexName,
  onEditSearchIndexClick,
  dataTestId = 'server-error-banner',
  className,
}: ServerErrorBannerProps) {
  const { openDrawer } = useDrawerActions();
  const track = useTelemetry();
  const { atlasMetadata } = useConnectionInfo();
  const rerankNotEnabled = isRerankNotEnabledError(message);
  const description = rerankNotEnabled
    ? 'Enable native reranking in project settings.'
    : message;
  const projectSettingsHref =
    rerankNotEnabled && atlasMetadata
      ? buildProjectSettingsUrl({ projectId: atlasMetadata.projectId })
      : null;

  return (
    <Banner
      variant="danger"
      data-testid={dataTestId}
      className={cx(bannerStyles, className)}
    >
      {rerankNotEnabled ? (
        <>
          <b>Native reranking not enabled</b>
          <br />
          <div className={bannerContentStyles}>
            <span>{description}</span>
            {projectSettingsHref && (
              <Button
                size="xsmall"
                href={projectSettingsHref}
                target="_blank"
                rightGlyph={<Icon glyph="OpenNewTab" />}
              >
                Project Settings
              </Button>
            )}
          </div>
        </>
      ) : (
        message
      )}
      {searchIndexName &&
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
