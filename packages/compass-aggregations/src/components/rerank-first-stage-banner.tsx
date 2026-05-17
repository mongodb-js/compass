import React from 'react';
import {
  Banner,
  Button,
  Icon,
  Link,
  css,
  spacing,
  usePersistedState,
} from '@mongodb-js/compass-components';
import { usePreference } from 'compass-preferences-model/provider';
import { useAssistantActions } from '@mongodb-js/compass-assistant';
import { STAGE_HELP_BASE_URL } from '../constants';

export const useRerankInsightAction = () => {
  const { tellMoreAboutInsight } = useAssistantActions();
  return tellMoreAboutInsight
    ? () => tellMoreAboutInsight({ id: 'rerank-first-stage' })
    : undefined;
};
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
  alignItems: 'flex-end',
});

const bannerTextStyles = css({
  flex: 1,
  minWidth: 0,
});

const bannerButtonStyles = css({
  flexShrink: 0,
  whiteSpace: 'nowrap',
  marginLeft: spacing[200],
});
export const RerankFirstStageBanner = ({
  'data-testid': dataTestId,
}: {
  'data-testid'?: string;
}) => {
  const enableRerank = usePreference('enableRerank');
  const [isDismissed, setIsDismissed] = usePersistedState(
    'mongodb_compass_dismissed_rerank_first_stage_banner',
    false
  );
  const onInsightAction = useRerankInsightAction();

  if (!enableRerank || isDismissed) {
    return null;
  }

  return (
    <Banner
      variant="warning"
      data-testid={dataTestId}
      className={bannerStyles}
      dismissible
      onClose={() => setIsDismissed(true)}
    >
      <div className={bannerContentStyles}>
        <div className={bannerTextStyles}>
          <strong>$rerank works better following a search stage</strong>
          <br />
          {
            "If you're just trying out $rerank, there's a chance you may consume an excessive amount of tokens, which can be expensive. $rerank works best following a search stage like "
          }
          <Link
            href={`${STAGE_HELP_BASE_URL}/search/`}
            target="_blank"
            hideExternalIcon
          >
            $search
          </Link>
          {', '}
          <Link
            href={`${STAGE_HELP_BASE_URL}/vectorSearch/`}
            target="_blank"
            hideExternalIcon
          >
            $vectorSearch
          </Link>
          {', '}
          <Link
            href={`${STAGE_HELP_BASE_URL}/rankFusion/`}
            target="_blank"
            hideExternalIcon
          >
            $rankFusion
          </Link>
          {', or '}
          <Link
            href={`${STAGE_HELP_BASE_URL}/scoreFusion/`}
            target="_blank"
            hideExternalIcon
          >
            $scoreFusion
          </Link>
          .
        </div>
        {onInsightAction && (
          <Button
            size="xsmall"
            className={bannerButtonStyles}
            onClick={onInsightAction}
            leftGlyph={<Icon glyph="Sparkle" />}
            data-testid="rerank-first-stage-learn-more-button"
          >
            Learn more
          </Button>
        )}
      </div>
    </Banner>
  );
};
