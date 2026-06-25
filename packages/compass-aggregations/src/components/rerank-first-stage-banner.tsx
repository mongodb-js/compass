import React, { useCallback, useMemo } from 'react';
import {
  Banner,
  Button,
  Icon,
  Link,
  PerformanceSignals,
  css,
  spacing,
  usePersistedState,
} from '@mongodb-js/compass-components';
import { usePreference } from 'compass-preferences-model/provider';
import { useAssistantActions } from '@mongodb-js/compass-assistant';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';
import { useConnectionInfo } from '@mongodb-js/compass-connections/provider';
import { buildAtlasSearchClustersUrl } from '@mongodb-js/atlas-service/provider';
import { STAGE_HELP_BASE_URL } from '../constants';

export const useRerankInsightAction = () => {
  const { tellMoreAboutInsight } = useAssistantActions();
  const action = useCallback(() => {
    tellMoreAboutInsight?.({ id: 'rerank-first-stage' });
  }, [tellMoreAboutInsight]);
  return tellMoreAboutInsight ? action : undefined;
};

const searchStageLinks = (
  <>
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
  </>
);

const rerankInsightDescription = (
  <>
    {
      "You're attempting to run a query with $rerank as the only stage. This is expensive and increases strain. We recommend using $rerank as the second stage to "
    }
    {searchStageLinks}
    {'.'}
  </>
);

export const useRerankInsight = ({
  isRerankFirstStage,
  hasSearchIndex,
  isSearchIndexesLoading,
  onAddSearchStageBefore,
}: {
  isRerankFirstStage: boolean;
  hasSearchIndex: boolean;
  isSearchIndexesLoading: boolean;
  onAddSearchStageBefore: () => void;
}) => {
  const enableRerank = usePreference('enableRerank');
  const track = useTelemetry();
  const rawOnAssistantButtonClick = useRerankInsightAction();
  const { atlasMetadata } = useConnectionInfo();

  const learnAboutSearchUrl = atlasMetadata
    ? buildAtlasSearchClustersUrl({ projectId: atlasMetadata.projectId })
    : 'https://dochub.mongodb.org/core/atlas-search';

  const onAddSearchStageBeforeWithTracking = useCallback(() => {
    track('Rerank Add Search Stage Button Clicked', {
      context: 'Rerank Insight',
    });
    onAddSearchStageBefore();
  }, [track, onAddSearchStageBefore]);

  const onLearnAboutSearchWithTracking = useCallback(() => {
    track('Rerank Learn About Search Button Clicked', {
      context: 'Rerank Insight',
    });
    window.open(learnAboutSearchUrl, '_blank', 'noopener noreferrer');
  }, [track, learnAboutSearchUrl]);

  const onAssistantButtonClickWithTracking = useCallback(() => {
    track('Rerank Tell Me More Button Clicked', {
      context: 'Rerank Insight',
    });
    rawOnAssistantButtonClick?.();
  }, [track, rawOnAssistantButtonClick]);

  return useMemo(() => {
    if (!enableRerank || !isRerankFirstStage) return undefined;

    return {
      ...PerformanceSignals.get('rerank-without-search'),
      description: rerankInsightDescription,
      primaryActionButtonIsLoading: isSearchIndexesLoading,
      primaryActionButtonLabel: isSearchIndexesLoading
        ? undefined
        : hasSearchIndex
        ? 'Add $search stage'
        : 'Learn about search',
      ...(hasSearchIndex && !isSearchIndexesLoading
        ? { onPrimaryActionButtonClick: onAddSearchStageBeforeWithTracking }
        : !isSearchIndexesLoading
        ? { onPrimaryActionButtonClick: onLearnAboutSearchWithTracking }
        : {}),
      onAssistantButtonClick: rawOnAssistantButtonClick
        ? onAssistantButtonClickWithTracking
        : undefined,
    };
  }, [
    enableRerank,
    isRerankFirstStage,
    hasSearchIndex,
    isSearchIndexesLoading,
    onAddSearchStageBeforeWithTracking,
    onLearnAboutSearchWithTracking,
    rawOnAssistantButtonClick,
    onAssistantButtonClickWithTracking,
  ]);
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
  gap: spacing[200],
});

const bannerTextStyles = css({
  flex: 1,
  minWidth: 0,
});

const bannerButtonStyles = css({
  flexShrink: 0,
  whiteSpace: 'nowrap',
});

export const RerankFirstStageBanner = ({
  'data-testid': dataTestId,
  onBeforeAssistantOpen,
}: {
  'data-testid'?: string;
  onBeforeAssistantOpen?: () => void;
}) => {
  const enableRerank = usePreference('enableRerank');
  const track = useTelemetry();
  const [isDismissed, setIsDismissed] = usePersistedState(
    'mongodb_compass_dismissed_rerank_first_stage_banner',
    false
  );
  const insightAction = useRerankInsightAction();
  const onInsightAction = useMemo(
    () =>
      insightAction
        ? () => {
            onBeforeAssistantOpen?.();
            insightAction();
          }
        : undefined,
    [insightAction, onBeforeAssistantOpen]
  );

  if (!enableRerank || isDismissed) {
    return null;
  }

  return (
    <Banner
      variant="warning"
      data-testid={dataTestId}
      className={bannerStyles}
      dismissible
      onClose={() => {
        track('Rerank First Stage Banner Dismissed', {
          context: 'Rerank First Stage Banner',
        });
        setIsDismissed(true);
      }}
    >
      <div className={bannerContentStyles}>
        <div className={bannerTextStyles}>
          <strong>$rerank works better following a search stage</strong>
          <br />
          {
            'Optimize performance and cost by using $rerank after retrieving preliminary results from a stage like '
          }
          {searchStageLinks}
          {'.'}
        </div>
        {onInsightAction && (
          <Button
            size="xsmall"
            className={bannerButtonStyles}
            onClick={() => {
              track('Rerank First Stage Banner Learn More Clicked', {
                context: 'Rerank First Stage Banner',
              });
              onInsightAction?.();
            }}
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
