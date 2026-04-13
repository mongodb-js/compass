import React from 'react';

import {
  css,
  spacing,
  Link,
  Banner,
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

type ServerErrorBannerProps = {
  message: string;
  searchIndexName: string | null;
  onEditSearchIndexClick?: (indexName: string) => void;
  dataTestId?: string;
};

export default function ServerErrorBanner({
  message,
  searchIndexName,
  onEditSearchIndexClick,
  dataTestId = 'server-error-banner',
}: ServerErrorBannerProps) {
  const { openDrawer } = useDrawerActions();
  const track = useTelemetry();
  const { atlasMetadata } = useConnectionInfo();

  const rerankNotEnabled = isRerankNotEnabledError(message);
  const title = rerankNotEnabled ? 'Native Reranking not enabled' : message;
  const description = rerankNotEnabled
    ? 'Enable native reranking in project settings.'
    : message;
  const projectSettingsHref =
    rerankNotEnabled && atlasMetadata
      ? buildProjectSettingsUrl(atlasMetadata)
      : null;

  return (
    <Banner
      variant="danger"
      data-testid={dataTestId}
      title={title}
      className={bannerStyles}
    >
      {description}
      {projectSettingsHref && (
        <>
          {' '}
          <Link href={projectSettingsHref}>Project Settings</Link>
        </>
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
