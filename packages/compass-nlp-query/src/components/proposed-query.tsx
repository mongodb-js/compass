import React from 'react';
import {
  Body,
  Button,
  Code,
  css,
  Icon,
  spacing,
} from '@mongodb-js/compass-components';

const containerStyles = css({
  padding: 0,
  marginTop: spacing[2],
});

const runButtonStyles = css({
  marginTop: spacing[2],
});

const openAggregationButtonStyles = css({
  marginLeft: spacing[2],
  whiteSpace: 'nowrap',
  display: 'flex',
});

const mqlCodeContainerStyles = css({
  maxWidth: spacing[7] * 10,
  display: 'flex',
  alignItems: 'center',
});

type ProposedQueryProps = {
  mqlText: string;
  translateTimeMS: number;
  onClickOpenAggregation: () => void;
  onClickRunQuery: () => void;
};

function ProposedQuery({
  mqlText,
  translateTimeMS,
  onClickOpenAggregation,
  onClickRunQuery,
}: ProposedQueryProps): React.ReactElement {
  // const onClickOpenAggregation = useCallback(() => {
  //   // TODO: Better app registry access (provider from home).
  //   // global.hadronApp!.appRegistry.emit('open-namespace-in-new-tab', {
  //   //   ...metadata,
  //   //   aggregation: item.type === 'aggregation' ? item.aggregation : null,
  //   //   query: item.type === 'query' ? item.query : null,
  //   // });
  // }, []);

  return (
    <div className={containerStyles}>
      <Body>
        Translated in <strong>{translateTimeMS} ms</strong>.
      </Body>
      <div className={mqlCodeContainerStyles}>
        <Code language="javascript">{mqlText}</Code>
        <Button
          className={openAggregationButtonStyles}
          onClick={onClickOpenAggregation}
          leftGlyph={<Icon glyph={'Export'} />}
          variant="primaryOutline"
          size="small"
          disabled={!mqlText}
        >
          Open in Aggregations
        </Button>
      </div>
      <Button
        className={runButtonStyles}
        variant="primary"
        onClick={onClickRunQuery}
      >
        Run
      </Button>
    </div>
  );
}

export { ProposedQuery };
