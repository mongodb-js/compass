import React, { useEffect } from 'react';
import {
  Banner,
  BannerVariant,
  Link,
  css,
} from '@mongodb-js/compass-components';
import { useConnectionInfo } from '@mongodb-js/compass-connections/provider';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';
import {
  buildSearchExtensionRateLimitsUrl,
  buildBillingUrl,
} from '@mongodb-js/atlas-service/provider';
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
  const track = useTelemetry();

  useEffect(() => {
    track('Search Extension Rate Limit Banner Shown', {
      context: 'Search Extension Rate Limit Banner',
      search_extension_type: searchExtensionType ?? null,
      rate_limit_type: rateLimitInfo.type,
    });
  }, [track, searchExtensionType, rateLimitInfo.type]);

  if (rateLimitInfo.type === 'billing') {
    const billingHref = atlasMetadata
      ? buildBillingUrl({ orgId: atlasMetadata.orgId })
      : null;
    return (
      <Banner
        variant={BannerVariant.Danger}
        data-testid={dataTestId}
        className={bannerStyles}
      >
        <strong>Query rate limits exceeded</strong>
        <br />
        You are currently on Tier 0 with reduced rate limits of{' '}
        {rateLimitInfo.limits}.{' '}
        {billingHref ? (
          <Link
            href={billingHref}
            target="_blank"
            onClick={() =>
              track('Search Extension Rate Limit Billing Link Clicked', {
                context: 'Search Extension Rate Limit Banner',
                search_extension_type: searchExtensionType ?? null,
              })
            }
          >
            Add a payment method
          </Link>
        ) : (
          'Add a payment method'
        )}{' '}
        for your organization to unlock the higher tier.
      </Banner>
    );
  }

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
            <Link
              href={rateLimitsHref}
              target="_blank"
              onClick={() =>
                track('Search Extension Rate Limit Page Link Clicked', {
                  context: 'Search Extension Rate Limit Banner',
                  search_extension_type: searchExtensionType ?? null,
                  rate_limit_type: rateLimitInfo.type,
                })
              }
            >
              View Rate Limit
            </Link>
          </>
        )}
      </span>
    </Banner>
  );
}
