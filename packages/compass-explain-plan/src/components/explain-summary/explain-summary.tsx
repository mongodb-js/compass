import { useMemo } from 'react';
import React from 'react';
import {
  Body,
  Subtitle,
  css,
  Icon,
  KeylineCard,
  IndexKeysBadge,
  palette,
  spacing,
  useDarkMode,
  Link,
} from '@mongodb-js/compass-components';

const EXECUTION_STATS_HELP_LINK =
  'https://www.mongodb.com/docs/upcoming/reference/explain-results/#mongodb-data-explain.executionStats';

type IndexType = 'COLLSCAN' | 'COVERED' | 'MULTIPLE' | 'INDEX' | 'UNAVAILABLE';

interface ExplainSummaryProps {
  nReturned: number;
  totalKeysExamined: number;
  totalDocsExamined: number;
  executionTimeMillis: number;
  inMemorySort: boolean;
  indexType: IndexType;
  index?: { fields: { field: string; value: unknown }[] };
}

const SummaryIndexStat: React.FC<{
  indexType: IndexType;
  index?: { fields: { field: string; value: unknown }[] };
  className?: string;
}> = ({ indexType, index, className }) => {
  const darkMode = useDarkMode();

  const warningColor = darkMode ? palette.yellow.base : palette.yellow.dark2;
  const successColor = darkMode ? palette.green.base : palette.green.dark2;

  const indexMessageText = useMemo(() => {
    const typeToMessage = {
      COLLSCAN: 'No index available for this query.',
      COVERED: 'Query covered by index:',
      MULTIPLE: 'Shard results differ (see details below)',
      INDEX: 'Query used the following index:',
      UNAVAILABLE: '',
    };
    return typeToMessage[indexType];
  }, [indexType]);

  const indexMessageIcon = useMemo(() => {
    const checkMarkIcon = <Icon glyph="CheckmarkWithCircle" size="small" />;
    const warningIcon = <Icon glyph="Warning" size="small" />;
    const typeToIcon = {
      COLLSCAN: warningIcon,
      COVERED: checkMarkIcon,
      MULTIPLE: warningIcon,
      INDEX: null,
      UNAVAILABLE: null,
    };
    return typeToIcon[indexType];
  }, [indexType]);

  const typeToColor = {
    COLLSCAN: warningColor,
    COVERED: successColor,
    MULTIPLE: warningColor,
    INDEX: undefined,
    UNAVAILABLE: undefined,
  };

  return (
    <div
      className={className}
      data-testid="summary-index-stat"
      style={{ color: typeToColor[indexType] }}
    >
      {indexMessageIcon}{' '}
      <span data-testid="summary-index-stat-message">{indexMessageText}</span>{' '}
      {index ? (
        <IndexKeysBadge
          data-testid="summary-index-stat-badge"
          keys={index.fields}
        ></IndexKeysBadge>
      ) : null}
    </div>
  );
};

const SummaryStat: React.FunctionComponent<{
  'data-testid'?: string;
  label: string;
  value: unknown;
  className?: string;
}> = ({ 'data-testid': dataTestId, label, value, className }) => (
  <Body className={className} data-testid={dataTestId}>
    <span data-testid={dataTestId ? `${dataTestId}-label` : ''}>{label}</span>{' '}
    <b data-testid={dataTestId ? `${dataTestId}-value` : ''}>{value}</b>
  </Body>
);

const explainSummaryStyles = css({ padding: spacing[3] });
const explainSummaryTitleStyles = css({
  display: 'inline',
  marginRight: spacing[2],
});
const columnStyles = css({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gridGap: spacing[2],
  marginTop: spacing[2],
});

const rowStyles = css({ marginTop: spacing[2] });

const ExplainSummary: React.FC<ExplainSummaryProps> = ({
  nReturned,
  totalKeysExamined,
  totalDocsExamined,
  executionTimeMillis,
  inMemorySort,
  indexType,
  index,
}) => {
  const inMemorySortValue = inMemorySort ? 'yes' : 'no';

  return (
    <KeylineCard className={explainSummaryStyles} data-testid="explain-summary">
      <div>
        <Subtitle className={explainSummaryTitleStyles}>
          Query Performance Summary
        </Subtitle>{' '}
        <Link href={EXECUTION_STATS_HELP_LINK}>Docs</Link>
      </div>
      <div className={columnStyles}>
        <div>
          <SummaryStat
            className={rowStyles}
            data-testid="nReturned-summary"
            label="Documents Returned:"
            value={nReturned}
          />
          <SummaryStat
            className={rowStyles}
            data-testid="totalKeysExamined-summary"
            label="Index Keys Examined:"
            value={totalKeysExamined}
          />
          <SummaryStat
            className={rowStyles}
            data-testid="totalDocsExamined-summary"
            label="Documents Examined:"
            value={totalDocsExamined}
          />
        </div>
        <div>
          <SummaryStat
            className={rowStyles}
            data-testid="executionTimeMillis-summary"
            label="Actual Query Execution Time (ms):"
            value={executionTimeMillis}
          />
          <SummaryStat
            className={rowStyles}
            label="Sorted in Memory:"
            data-testid="inMemorySort-summary"
            value={inMemorySortValue}
          />
          <SummaryIndexStat
            className={rowStyles}
            indexType={indexType}
            index={index}
          />
        </div>
      </div>
    </KeylineCard>
  );
};

export default ExplainSummary;
