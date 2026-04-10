import React from 'react';

import {
  css,
  spacing,
  Link,
  Banner,
  useDrawerActions,
} from '@mongodb-js/compass-components';
import { isSearchIndexDefinitionError } from '../utils/search-stage-errors';

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

  return (
    <Banner
      variant="danger"
      data-testid={dataTestId}
      title={message}
      className={bannerStyles}
    >
      {message}
      {searchIndexName &&
        isSearchIndexDefinitionError(message) &&
        onEditSearchIndexClick && (
          <>
            {' '}
            <Link
              onClick={() => {
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
