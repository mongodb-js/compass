import React, { useCallback, useState } from 'react';
import { css, cx, spacing } from '@mongodb-js/compass-components';
import type { DataService } from 'mongodb-data-service';
import type AppRegistry from 'hadron-app-registry';

import { QueryInput } from './query-input';
import { QueryResults } from './query-results';
import { useNLPQuery } from '../hooks/use-nlp-query';

const containerStyles = css({
  flexGrow: 1,
});

const paddedContainerStyles = css({
  padding: spacing[4],
});

type NLPQueryProps = {
  dataService: DataService;
  namespace: string;
  noPadding?: boolean;
  localAppRegistry: AppRegistry;
};

function NLPQuery({
  dataService,
  namespace,
  noPadding,
  localAppRegistry,
}: NLPQueryProps): React.ReactElement {
  // Example query text:
  // aggregate which documents have the country either France or Spain
  const [queryText, setQueryText] = useState('');

  const [
    {
      translateState,
      translateErrorMessage,
      translateTimeMS,

      mqlText,

      resultState,
      resultErrorMessage,
      resultDocuments,
      resultsViewType,
    },
    { onClearError, onTranslateQuery, onRunQuery, setResultsViewType },
  ] = useNLPQuery({
    dataService,
    namespace,
    queryText,
  });

  const onOpenAggregation = useCallback(() => {
    localAppRegistry.emit('open-aggregation-in-editor', mqlText);
  }, [localAppRegistry, mqlText]);

  return (
    <div className={cx(containerStyles, !noPadding && paddedContainerStyles)}>
      <QueryInput
        queryText={queryText}
        onTranslateQuery={onTranslateQuery}
        setQueryText={setQueryText}
      />
      <QueryResults
        queryText={queryText}
        translateState={translateState}
        translateErrorMessage={translateErrorMessage}
        translateTimeMS={translateTimeMS}
        mqlText={mqlText}
        resultState={resultState}
        resultErrorMessage={resultErrorMessage}
        resultDocuments={resultDocuments}
        resultsViewType={resultsViewType}
        onOpenAggregation={onOpenAggregation}
        onClearError={onClearError}
        onTranslateQuery={onTranslateQuery}
        onRunQuery={onRunQuery}
        setResultsViewType={setResultsViewType}
      />
    </div>
  );
}

export { NLPQuery };

// Other test prompts (simple):
// match all where type does not equal earthquake
