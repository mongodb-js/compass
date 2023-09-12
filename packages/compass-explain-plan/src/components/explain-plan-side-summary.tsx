import React, { useMemo } from 'react';
import type { ReactHTML, ReactElement, ReactNode } from 'react';
import {
  InlineDefinition,
  KeylineCard,
  Subtitle,
  css,
  spacing,
  palette,
  useDarkMode,
  cx,
  IndexBadge,
  IndexIcon,
  Icon,
  SignalPopover,
  PerformanceSignals,
} from '@mongodb-js/compass-components';
import {
  openCreateIndexModal,
  type SerializedExplainPlan,
} from '../stores/explain-plan-modal-store';
import { connect } from 'react-redux';
import { usePreference } from 'compass-preferences-model';

const defaultFormatter = (_: unknown) => String(_);

const statsStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[2],
});

const statsTextStyles = css({
  lineHeight: '20px',
});

const ExplainPlanSummaryStat = <T extends string | boolean | number>({
  as = 'li',
  glyph,
  value,
  formatter = defaultFormatter,
  label,
  definition,
  'data-testid': dataTestId,
}: {
  as?: keyof ReactHTML;
  glyph?: ReactElement;
  value?: T;
  formatter?: (val: T) => string;
  label: ReactNode;
  definition: React.ReactNode;
  ['data-testid']?: string;
}): ReactElement | null => {
  return React.createElement(
    as,
    { className: statsStyles },
    glyph
      ? React.cloneElement(glyph, {
          viewBox: `0 0 ${spacing[3]} ${spacing[3]}`,
          width: spacing[3],
          height: spacing[3],
        })
      : null,
    <InlineDefinition
      definition={definition}
      className={statsTextStyles}
      tooltipProps={{ align: 'left', spacing: spacing[3] }}
      data-testid={dataTestId}
    >
      {typeof value === 'undefined' ? (
        label
      ) : (
        <>
          <strong>{formatter(value)}</strong>&nbsp;{label}
        </>
      )}
    </InlineDefinition>
  );
};

type ExplainPlanSummaryProps = {
  docsReturned: number;
  docsExamined: number;
  executionTimeMs: number;
  sortedInMemory: boolean;
  indexKeysExamined: number;
  indexType: SerializedExplainPlan['indexType'];
  indexKeys: [string, unknown][];
  onCreateIndexInsightClick(): void;
};

const summaryCardStyles = css({
  display: 'grid',
  gridTemplateRows: 'auto 1fr',
  maxHeight: '100%',
  overflow: 'hidden',
});

const summaryHeadingStyles = css({
  paddingTop: spacing[3],
  paddingBottom: spacing[3],
  paddingLeft: spacing[4],
  paddingRight: spacing[4],
  backgroundColor: palette.gray.light3,
  boxShadow: `0 0 0 1px ${palette.gray.light2}`,
});

const summaryHeadingDarkModeStyles = css({
  backgroundColor: palette.gray.dark3,
  boxShadow: `0 0 0 1px ${palette.gray.dark2}`,
});

const statsListStyles = css({
  display: 'grid',
  gap: spacing[3],
  paddingTop: spacing[3],
  paddingBottom: spacing[4],
  paddingLeft: spacing[4],
  paddingRight: spacing[4],
  overflow: 'auto',
});

const indexesSummaryStyles = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: spacing[2],
});

const indexIconDescriptionStyles = css({
  verticalAlign: 'text-top',
});

export const ExplainPlanSummary: React.FunctionComponent<
  ExplainPlanSummaryProps
> = ({
  docsReturned,
  docsExamined,
  executionTimeMs,
  sortedInMemory,
  indexKeysExamined,
  indexType,
  indexKeys,
  onCreateIndexInsightClick,
}) => {
  const darkMode = useDarkMode();
  const showInsights = usePreference('showInsights', React);

  const warningColor = darkMode ? palette.yellow.base : palette.yellow.dark2;

  const indexMessageText = useMemo(() => {
    const typeToMessage = {
      COLLSCAN: 'No index available for this query.',
      COVERED: 'Query covered by index:',
      MULTIPLE: 'Query used the following indexes (shard results differ):',
      INDEX: 'Query used the following index:',
      UNAVAILABLE: '',
    };
    return typeToMessage[indexType];
  }, [indexType]);

  const hasNoIndex = ['COLLSCAN', 'UNAVAILABLE'].includes(indexType);

  return (
    <KeylineCard
      className={summaryCardStyles}
      data-testid="explain-plan-summary"
    >
      <Subtitle
        className={cx(
          summaryHeadingStyles,
          darkMode && summaryHeadingDarkModeStyles
        )}
      >
        Query Performance Summary
      </Subtitle>

      <ul className={statsListStyles}>
        <ExplainPlanSummaryStat
          glyph={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none">
              <g stroke="#889397" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 2v2.66667c0 .17681.0702.34638.1953.4714.125.12503.2946.19526.4714.19526h2.6666" />
                <path d="M12 11.3333H7.33333c-.35362 0-.69276-.1404-.94281-.3905C6.14048 10.6928 6 10.3536 6 10V3.33333c0-.35362.14048-.69276.39052-.94281C6.64057 2.14048 6.97971 2 7.33333 2H10l3.3333 3.33333V10c0 .3536-.1404.6928-.3905.9428-.25.2501-.5892.3905-.9428.3905Z" />
                <path d="M10.6666 11.3333v1.3334c0 .3536-.1405.6927-.3905.9428-.2501.25-.58923.3905-.94285.3905H4.66659c-.35363 0-.69277-.1405-.94281-.3905-.25005-.2501-.39053-.5892-.39053-.9428V6.00001c0-.35363.14048-.69277.39053-.94281.25004-.25005.58918-.39053.94281-.39053h1.33333" />
              </g>
            </svg>
          }
          value={docsReturned}
          data-testid="docsReturned"
          label="documents returned"
          definition="Number of documents returned by the query."
        ></ExplainPlanSummaryStat>

        <ExplainPlanSummaryStat
          glyph={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none">
              <g stroke="#889397" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.33325 2v2.66667c0 .17681.07024.34638.19526.4714.12503.12503.2946.19526.47141.19526h2.66668" />
                <path d="M7.99992 14H4.66659c-.35363 0-.69277-.1405-.94281-.3905-.25005-.2501-.39053-.5892-.39053-.9428V3.33333c0-.35362.14048-.69276.39053-.94281C3.97382 2.14048 4.31296 2 4.66659 2h4.66666l3.33335 3.33333v3" />
                <path d="M9.33325 11.6667c0 .442.1756.8659.48816 1.1785.31259.3125.73649.4881 1.17849.4881.442 0 .866-.1756 1.1785-.4881.3126-.3126.4882-.7365.4882-1.1785 0-.4421-.1756-.866-.4882-1.1785-.3125-.3126-.7365-.4882-1.1785-.4882-.442 0-.8659.1756-1.17849.4882-.31256.3125-.48816.7364-.48816 1.1785ZM12.3333 13l1.6666 1.6667" />
              </g>
            </svg>
          }
          value={docsExamined}
          data-testid="docsExamined"
          label="documents examined"
          definition="Number of documents examined during query execution. When an index covers a query, this value is 0."
        ></ExplainPlanSummaryStat>

        <ExplainPlanSummaryStat
          glyph={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none">
              <g stroke="#889397" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 8c0 .78793.15519 1.56815.45672 2.2961.30153.728.74349 1.3894 1.30064 1.9465.55715.5572 1.21859.9991 1.94654 1.3007C6.43185 13.8448 7.21207 14 8 14s1.56815-.1552 2.2961-.4567c.728-.3016 1.3894-.7435 1.9465-1.3007.5572-.5571.9991-1.2185 1.3007-1.9465C13.8448 9.56815 14 8.78793 14 8c0-1.5913-.6321-3.11742-1.7574-4.24264C11.1174 2.63214 9.5913 2 8 2c-1.5913 0-3.11742.63214-4.24264 1.75736C2.63214 4.88258 2 6.4087 2 8Z" />
                <path d="M8 4.66667v3.33334L10 10" />
              </g>
            </svg>
          }
          value={executionTimeMs}
          data-testid="executionTimeMs"
          formatter={(val) => `${String(val)}\xa0ms`}
          label="execution time"
          definition="Total time in milliseconds for query plan selection and query execution."
        ></ExplainPlanSummaryStat>

        <ExplainPlanSummaryStat
          glyph={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none">
              <path
                fill="#889397"
                fillRule="evenodd"
                d="M5.26047 5.79391c-.18746.18746-.18746.49137 0 .67883.18745.18745.49137.18745.67882 0l2.06059-2.0606 2.06062 2.0606c.1874.18745.4913.18745.6788 0 .1874-.18746.1874-.49137 0-.67883l-2.40001-2.4c-.09003-.09001-.21212-.14058-.33941-.14058-.12731 0-.2494.05057-.33942.14058l-2.39999 2.4Zm5.47883 4.41219c.1874-.1875.1874-.4914 0-.67885-.1875-.18745-.4914-.18745-.6788 0L7.99988 11.5878 5.93929 9.52725c-.18745-.18745-.49137-.18745-.67882 0-.18746.18745-.18746.49135 0 .67885l2.39999 2.4c.18746.1874.49138.1874.67883 0l2.40001-2.4Z"
                clipRule="evenodd"
              />
            </svg>
          }
          value={sortedInMemory}
          data-testid="sortedInMemory"
          formatter={(val) => (val ? 'Is' : 'Is not')}
          label="sorted in memory"
          definition="Indicates whether the sort operation occurred in system memory. In-memory sorts perform better than on-disk sorts."
        ></ExplainPlanSummaryStat>

        <ExplainPlanSummaryStat
          glyph={
            <svg xmlns="http://www.w3.org/2000/svg" fill="none">
              <g stroke="#889397" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5.33325 8.5c0 .30942.28095.60617.78105.82496.5001.21879 1.17837.34171 1.88562.34171.70724 0 1.38552-.12292 1.88562-.34171.50006-.21879.78106-.51554.78106-.82496 0-.30942-.281-.60616-.78106-.82496-.5001-.21879-1.17838-.3417-1.88562-.3417-.70725 0-1.38552.12291-1.88562.3417-.5001.2188-.78105.51554-.78105.82496Z" />
                <path d="M5.33325 8.33334v2.49996c0 .644 1.19334 1.1667 2.66667 1.1667 1.47333 0 2.66668-.5227 2.66668-1.1667V8.33334M9.33325 2v2.66667c0 .17681.07024.34638.19526.4714.12503.12503.2946.19526.47141.19526h2.66668" />
                <path d="M11.3333 14H4.66659c-.35363 0-.69277-.1405-.94281-.3905-.25005-.2501-.39053-.5892-.39053-.9428V3.33333c0-.35362.14048-.69276.39053-.94281C3.97382 2.14048 4.31296 2 4.66659 2h4.66666l3.33335 3.33333v7.33337c0 .3536-.1405.6927-.3905.9428-.2501.25-.5892.3905-.9428.3905Z" />
              </g>
            </svg>
          }
          value={indexKeysExamined}
          data-testid="indexKeysExamined"
          label="index keys examined"
          definition="Number of indexes examined to fulfill the query."
        ></ExplainPlanSummaryStat>

        {!hasNoIndex && (
          <div className={indexesSummaryStyles}>
            <ExplainPlanSummaryStat
              as="div"
              label={indexMessageText}
              definition={
                <>
                  The index(es) used to fulfill the query. A value of{' '}
                  <IndexIcon
                    className={indexIconDescriptionStyles}
                    direction={1}
                  />{' '}
                  indicates an ascending index, and a value of{' '}
                  <IndexIcon
                    className={indexIconDescriptionStyles}
                    direction={-1}
                  />{' '}
                  indicates a descending index.
                </>
              }
            ></ExplainPlanSummaryStat>
            {indexKeys.map(([field, value]) => {
              return (
                <IndexBadge
                  key={`${field}:${String(value)}`}
                  field={field}
                  value={value}
                ></IndexBadge>
              );
            })}
          </div>
        )}

        {hasNoIndex && (
          <div className={statsStyles} style={{ color: warningColor }}>
            <Icon glyph="Warning"></Icon>
            <span>No index available for this query.</span>
            {showInsights && (
              <SignalPopover
                signals={{
                  ...PerformanceSignals.get('explain-plan-without-index'),
                  onPrimaryActionButtonClick: onCreateIndexInsightClick,
                }}
              ></SignalPopover>
            )}
          </div>
        )}
      </ul>
    </KeylineCard>
  );
};

export default connect(null, {
  onCreateIndexInsightClick: openCreateIndexModal,
})(ExplainPlanSummary);
