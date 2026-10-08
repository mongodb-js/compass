import { renderTemplate } from '../utils/render-template';
import React, { useCallback, useMemo } from 'react';
import {
  AssistantSparkleIcon,
  Banner,
  Button,
  Link,
  PerformanceSignals,
  css,
  cx,
  spacing,
  usePersistedState,
  useTranslation,
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

const SearchStageLinks = () => {
  const t = useTranslation();
  return (
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
      {t('aggregations.rerank.listLastSeparator', ', or ')}
      <Link
        href={`${STAGE_HELP_BASE_URL}/scoreFusion/`}
        target="_blank"
        hideExternalIcon
      >
        $scoreFusion
      </Link>
    </>
  );
};

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
  const t = useTranslation();
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
      description: (
        <>
          {renderTemplate(
            t(
              'aggregations.rerank.insightDescription',
              "You're attempting to run a query with $rerank as the first stage. This is expensive and increases strain. We recommend using $rerank as the second stage to {searchStages}."
            ),
            { searchStages: <SearchStageLinks /> }
          )}
        </>
      ),
      primaryActionButtonIsLoading: isSearchIndexesLoading,
      primaryActionButtonLabel: isSearchIndexesLoading
        ? undefined
        : hasSearchIndex
          ? t('aggregations.rerank.addSearchStage', 'Add $search stage')
          : t('aggregations.rerank.learnAboutSearch', 'Learn about search'),
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
    t,
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
  className,
  onBeforeAssistantOpen,
}: {
  className?: string;
  onBeforeAssistantOpen?: () => void;
}) => {
  const enableRerank = usePreference('enableRerank');
  const track = useTelemetry();
  const t = useTranslation();
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
      data-testid="rerank-first-stage-banner"
      className={cx(bannerStyles, className)}
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
          <strong>
            {t(
              'aggregations.rerank.worksBetter',
              '$rerank works better following a search stage'
            )}
          </strong>
          <br />
          {renderTemplate(
            t(
              'aggregations.rerank.optimize',
              'Optimize performance and cost by using $rerank after retrieving preliminary results from a stage like {searchStages}.'
            ),
            { searchStages: <SearchStageLinks /> }
          )}
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
            leftGlyph={<AssistantSparkleIcon />}
            data-testid="rerank-first-stage-learn-more-button"
          >
            {t('aggregations.rerank.learnMore', 'Learn more')}
          </Button>
        )}
      </div>
    </Banner>
  );
};
