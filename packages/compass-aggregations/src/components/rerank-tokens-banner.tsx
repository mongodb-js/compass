import React from 'react';
import {
  Banner,
  Button,
  Icon,
  css,
  spacing,
  usePersistedState,
} from '@mongodb-js/compass-components';
import { usePreference } from 'compass-preferences-model/provider';
import { useConnectionInfo } from '@mongodb-js/compass-connections/provider';
import { buildRerankTokenUsageUrl } from '@mongodb-js/atlas-service/provider';
const bannerButtonStyles = css({
  flexShrink: 0,
  whiteSpace: 'nowrap',
});

const bannerStyles = css({
  borderRadius: 0,
  border: 'none',
  '&::before': {
    display: 'none',
  },
});

const bannerContentStyles = css({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: spacing[200],
});

export const RerankTokensBanner = ({
  'data-testid': dataTestId,
}: {
  'data-testid'?: string;
}) => {
  const enableRerank = usePreference('enableRerank');
  const { atlasMetadata } = useConnectionInfo();
  const [isDismissed, setIsDismissed] = usePersistedState(
    'mongodb_compass_dismissed_rerank_tokens_banner',
    false
  );

  if (!enableRerank || isDismissed) {
    return null;
  }

  const viewTokenUsageHref = atlasMetadata
    ? buildRerankTokenUsageUrl(atlasMetadata)
    : 'https://dochub.mongodb.org/core/$rerank#metrics';

  return (
    <Banner
      variant="info"
      data-testid={dataTestId}
      className={bannerStyles}
      dismissible
      onClose={() => setIsDismissed(true)}
    >
      <strong>$rerank consumes tokens</strong>
      <br />
      <div className={bannerContentStyles}>
        <span>
          Turn off the preview or disable the stage to avoid running $rerank
          while editing.
        </span>
        <Button
          size="xsmall"
          onClick={() =>
            window.open(viewTokenUsageHref, '_blank', 'noopener noreferrer')
          }
          rightGlyph={<Icon glyph="OpenNewTab" />}
          className={bannerButtonStyles}
        >
          View token usage
        </Button>
      </div>
    </Banner>
  );
};
