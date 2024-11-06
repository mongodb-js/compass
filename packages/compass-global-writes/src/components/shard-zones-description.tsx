import {
  Body,
  css,
  Link,
  spacing,
  Subtitle,
} from '@mongodb-js/compass-components';
import { useConnectionInfo } from '@mongodb-js/compass-connections/provider';
import React from 'react';

const paragraphStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[100],
});

export function ShardZonesDescription() {
  const { atlasMetadata } = useConnectionInfo();
  return (
    <>
      <Subtitle>Location Codes</Subtitle>
      <div className={paragraphStyles}>
        <Body>
          Each document’s first field should include an ISO 3166-1 Alpha-2 code
          for the location it belongs to.
        </Body>
        <Body>
          We also support ISO 3166-2 subdivision codes for countries containing
          a cloud provider data center (both ISO 3166-1 and ISO 3166-2 codes may
          be used for these countries). All valid country codes and the zones to
          which they map are listed in the table below. Additionally, you can
          view a list of all location codes{' '}
          <Link href="/static/atlas/country_iso_codes.txt">here</Link>.
        </Body>
        <Body>
          {atlasMetadata?.projectId && atlasMetadata?.clusterName && (
            <>
              Locations’ zone mapping can be changed by navigating to this
              clusters{' '}
              <Link
                href={`/v2/${atlasMetadata?.projectId}#/clusters/edit/${atlasMetadata?.clusterName}`}
              >
                Edit Configuration
              </Link>{' '}
              page and clicking the Configure Location Mappings’ link above the
              map.
            </>
          )}
        </Body>
      </div>
    </>
  );
}
