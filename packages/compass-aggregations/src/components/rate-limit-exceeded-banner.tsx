import { renderTemplate } from '../utils/render-template';
import React, { useEffect } from 'react';
import {
  Banner,
  BannerVariant,
  Link,
  css,
  useTranslation,
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
  const t = useTranslation();

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
        <strong>
          {t(
            'aggregations.rateLimit.queryLimitsExceeded',
            'Query rate limits exceeded'
          )}
        </strong>
        <br />
        {renderTemplate(
          t(
            'aggregations.rateLimit.billing',
            'You are currently on Tier 0 with reduced rate limits of {limits}. {paymentLink} for your organization to unlock the higher tier.',
            { limits: rateLimitInfo.limits }
          ),
          {
            paymentLink: billingHref ? (
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
                {t(
                  'aggregations.rateLimit.addPaymentMethod',
                  'Add a payment method'
                )}
              </Link>
            ) : (
              t(
                'aggregations.rateLimit.addPaymentMethod',
                'Add a payment method'
              )
            ),
          }
        )}
      </Banner>
    );
  }

  const extensionLabel = searchExtensionType
    ? searchExtensionType === 'autoEmbedding'
      ? t('aggregations.rateLimit.autoEmbedding', 'auto embedding')
      : SEARCH_EXTENSION_LABELS[searchExtensionType]
    : '';

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
          ? t(
              'aggregations.rateLimit.queryLimitExceeded',
              'Query rate limit exceeded'
            )
          : t('aggregations.rateLimit.exceeded', 'Rate limit exceeded')}
      </strong>
      <br />
      <span>
        {rateLimitInfo.type === 'rpm'
          ? searchExtensionType
            ? t(
                'aggregations.rateLimit.rpmWithExtension',
                'Exceeded {limit} {extension} requests per minute rate limit',
                { limit: rateLimitInfo.limit, extension: extensionLabel }
              )
            : t(
                'aggregations.rateLimit.rpm',
                'Exceeded {limit} requests per minute rate limit',
                { limit: rateLimitInfo.limit }
              )
          : searchExtensionType
            ? t(
                'aggregations.rateLimit.tpmWithExtension',
                'Exceeded {limit} tokens per minute rate limit for {extension}',
                { limit: rateLimitInfo.limit, extension: extensionLabel }
              )
            : t(
                'aggregations.rateLimit.tpm',
                'Exceeded {limit} tokens per minute rate limit',
                { limit: rateLimitInfo.limit }
              )}
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
              {t('aggregations.rateLimit.view', 'View Rate Limit')}
            </Link>
          </>
        )}
      </span>
    </Banner>
  );
}
