import React from 'react';
import { css, spacing } from '@mongodb-js/compass-components';
import type { DataService } from 'mongodb-data-service';

import { useNLPQuery } from '../hooks/use-nlp-query';
import { DocumentResultsView } from './document-results-view';
import { TranslateView } from './translate-view';

const resultsContainerStyles = css({
  padding: spacing[2],
  paddingTop: spacing[2],
  paddingBottom: spacing[2],
  flexGrow: 1,
});

type QueryResultsProps = {
  dataService: DataService;
  namespace: string;
  queryText: string;
};

function QueryResults({
  dataService,
  namespace,
  queryText
}: QueryResultsProps): React.ReactElement {
  const [{
    translateState,
    translateErrorMessage,
    translateTimeMS,

    mqlText,

    resultState,
    resultErrorMessage,
    resultDocuments,
    resultsViewType,
  }, {
    onClearError,
    onTranslateQuery,
    onRunQuery,
    setResultsViewType
  }] = useNLPQuery({
    dataService,
    namespace,
    queryText
  });
  
  return (
    <div
      className={resultsContainerStyles}
    >
      <TranslateView
        mqlText={mqlText}

        onClearError={onClearError}
        onTranslateQuery={onTranslateQuery}
        onRunQuery={onRunQuery}

        translateState={translateState}
        translateErrorMessage={translateErrorMessage}
        translateTimeMS={translateTimeMS}
      />
      {translateState === 'loaded' && (
        <DocumentResultsView
          queryText={queryText}

          onClearError={onClearError}

          resultDocuments={resultDocuments}
          resultErrorMessage={resultErrorMessage}
          resultState={resultState}

          resultsViewType={resultsViewType}
          setResultsViewType={setResultsViewType}
        />
      )}
    </div>
  );
}

export { QueryResults };
