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
} from '@mongodb-js/compass-components';

interface IndexModel {
  fields: {
    serialize: () => {
      field: string;
      value: any;
    }[];
  };
}

interface ExplainSummaryProps {
  nReturned: number;
  totalKeysExamined: number;
  totalDocsExamined: number;
  executionTimeMillis: number;
  inMemorySort: boolean;
  indexType: 'COLLSCAN' | 'COVERED' | 'MULTIPLE' | 'INDEX';
  index?: IndexModel;
}

const SummaryIndexStat: React.FC<{
  indexType: 'COLLSCAN' | 'COVERED' | 'MULTIPLE' | 'INDEX';
  index?: IndexModel;
  className?: string;
}> = ({ indexType, index, className }) => {
  const indexMessageText = useMemo(() => {
    const typeToMessage = {
      COLLSCAN: 'No index available for this query.',
      COVERED: 'Query covered by index:',
      MULTIPLE: 'Shard results differ (see details below)',
      INDEX: 'Query used the following index:',
    };
    return typeToMessage[indexType];
  }, [indexType]);

  const indexMessageIcon = useMemo(() => {
    const greenCheckMark = (
      <Icon
        glyph="CheckmarkWithCircle"
        style={{ color: palette.green.dark2 }}
        size="small"
      />
    );
    const yellowWarning = (
      <Icon
        glyph="Warning"
        style={{ color: palette.yellow.base }}
        size="small"
      />
    );
    const typeToIcon = {
      COLLSCAN: yellowWarning,
      COVERED: greenCheckMark,
      MULTIPLE: yellowWarning,
      INDEX: null,
      UNAVAILABLE: null,
    };
    return typeToIcon[indexType];
  }, [indexType]);

  const indexMessageColorStyles = useMemo(() => {
    const typeToColor = {
      COLLSCAN: palette.yellow.dark2,
      COVERED: palette.green.dark2,
      MULTIPLE: palette.yellow.dark2,
      INDEX: null,
      UNAVAILABLE: null,
    };
    return css(typeToColor[indexType]);
  }, [indexType]);

  return (
    <div className={className}>
      {indexMessageIcon}{' '}
      <span className={indexMessageColorStyles}>{indexMessageText}</span>{' '}
      {index ? (
        <IndexKeysBadge keys={index.fields.serialize()}></IndexKeysBadge>
      ) : null}
    </div>
  );
};

const SummaryStat: React.FC<{
  dataTestId?: string;
  label: string;
  value: any;
  className?: string;
}> = ({ dataTestId, label, value, className }) => (
  <Body className={className} data-testid={dataTestId}>
    {label} <b>{value}</b>
  </Body>
);

const explainSummaryStyles = css({ padding: spacing[3] });
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
      <Subtitle>Query Performance Summary</Subtitle>
      <div className={columnStyles}>
        <div>
          <SummaryStat
            className={rowStyles}
            dataTestId="documents-returned-summary"
            label="Documents Returned:"
            value={nReturned}
          />
          <SummaryStat
            className={rowStyles}
            label="Index Keys Examined:"
            value={totalKeysExamined}
          />
          <SummaryStat
            className={rowStyles}
            label="Documents Examined:"
            value={totalDocsExamined}
          />
        </div>
        <div>
          <SummaryStat
            className={rowStyles}
            label="Actual Query Execution Time (ms):"
            value={executionTimeMillis}
          />
          <SummaryStat
            className={rowStyles}
            label="Sorted in Memory:"
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
