import React from 'react';
import {
  Banner,
  BannerVariant,
  Link,
  css,
} from '@mongodb-js/compass-components';
import { useConnectionInfo } from '@mongodb-js/compass-connections/provider';
import { buildSearchExtensionRateLimitsUrl } from '@mongodb-js/atlas-service/provider';
import type {
  VoyageRateLimitInfo,
  SearchExtensionType,
} from '../utils/search-stage-errors';

const SEARCH_EXTENSION_LABELS = {
  rerank: '$rerank',
  autoEmbedding: 'auto embedding',
} as const;

const bannerStyles = css({
  width: '100%',
  textAlign: 'left',
});

type RateLimitExceededBannerProps = {
  rateLimitInfo: VoyageRateLimitInfo;
  searchExtensionType?: SearchExtensionType | null;
  dataTestId?: string;
};

export default function RateLimitExceededBanner({
  rateLimitInfo,
  searchExtensionType,
  dataTestId = 'rate-limit-exceeded-banner',
}: RateLimitExceededBannerProps) {
  const { atlasMetadata } = useConnectionInfo();
  const rateLimitsHref =
    searchExtensionType && atlasMetadata
      ? buildSearchExtensionRateLimitsUrl({
          projectId: atlasMetadata.projectId,
          clusterName: atlasMetadata.clusterName,
          extensionType: searchExtensionType,
        })
      : null;

  return (
    <Banner
      variant={BannerVariant.Danger}
      data-testid={dataTestId}
      className={bannerStyles}
    >
      <strong>
        {searchExtensionType === 'autoEmbedding'
          ? 'Query rate limit exceeded'
          : 'Rate limit exceeded'}
      </strong>
      <br />
      <span>
        Exceeded {rateLimitInfo.limit}{' '}
        {rateLimitInfo.type === 'rpm' ? 'requests' : 'tokens'} per minute rate
        limit
        {searchExtensionType
          ? ` for ${SEARCH_EXTENSION_LABELS[searchExtensionType]}`
          : ''}
        {'.'}
        {rateLimitsHref && (
          <>
            {' '}
            <Link href={rateLimitsHref} target="_blank">
              View Rate Limit
            </Link>
          </>
        )}
      </span>
    </Banner>
  );
}
