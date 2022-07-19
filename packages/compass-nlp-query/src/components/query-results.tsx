import React from 'react';
import { css, spacing } from '@mongodb-js/compass-components';

import { DocumentResultsView } from './document-results-view';
import { TranslateView } from './translate-view';
import type { ResultState, TranslateState } from '../hooks/use-nlp-query';
import type { ResultsViewType } from './document-list';

const resultsContainerStyles = css({
  paddingTop: spacing[2],
  paddingBottom: spacing[2],
  flexGrow: 1,
});

type QueryResultsProps = {
  queryText: string;

  translateState: TranslateState;
  translateTimeMS: number;
  translateErrorMessage?: string;

  resultState: ResultState;
  resultErrorMessage?: string;

  mqlText: string;
  resultDocuments: Document[];
  resultsViewType: ResultsViewType;

  onOpenAggregation: () => void;
  onClearError: () => void;
  onTranslateQuery: () => Promise<void>;
  onRunQuery: () => Promise<void>;
  setResultsViewType: (viewType: ResultsViewType) => void;
};

function QueryResults({
  queryText,

  translateState,
  translateErrorMessage,
  translateTimeMS,

  mqlText,

  resultState,
  resultErrorMessage,
  resultDocuments,
  resultsViewType,

  onOpenAggregation,
  onClearError,
  onTranslateQuery,
  onRunQuery,
  setResultsViewType,
}: QueryResultsProps): React.ReactElement {
  return (
    <div className={resultsContainerStyles}>
      <TranslateView
        mqlText={mqlText}
        onClickOpenAggregation={onOpenAggregation}
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
