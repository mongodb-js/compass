import React from 'react';
import { Banner, css, usePersistedState } from '@mongodb-js/compass-components';
import { usePreference } from 'compass-preferences-model/provider';

const bannerStyles = css({
  borderRadius: 0,
  border: 'none',
  '&::before': {
    display: 'none',
  },
});

export const RerankTokensBanner = ({
  'data-testid': dataTestId,
}: {
  'data-testid': string;
}) => {
  const enableRerank = usePreference('enableRerank');
  const [isDismissed, setIsDismissed] = usePersistedState(
    'mongodb_compass_dismissed_rerank_tokens_banner',
    false
  );

  if (!enableRerank || isDismissed) {
    return null;
  }

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
      Turn off the preview or disable the stage to avoid running $rerank while
      editing.
    </Banner>
  );
};
