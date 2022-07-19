import React from 'react';
import { Banner, SpinLoader, css, spacing } from '@mongodb-js/compass-components';

import { DocumentList } from './document-list';
import type { ResultsViewType } from './document-list';
import { DocumentResultsHeader } from './document-results-header';
import type { ResultState } from '../hooks/use-nlp-query';

const loadingContainerStyles = css({
  padding: spacing[4],
});

const resultsHeaderStyles = css({
  paddingTop: spacing[2],
  paddingLeft: spacing[2],
  paddingRight: spacing[2],
});

const resultsStyles = css({
  height: '100%',
  overflowY: 'auto',
  '&:not(:first-child)': {
    height: `calc(100% - ${spacing[3]}px)`,
    marginTop: spacing[3]
  }
});


type DocumentResultsViewProps = {
  onClearError: () => void;

  queryText: string;

  resultDocuments: Document[];
  resultState: ResultState;
  resultErrorMessage?: string;

  resultsViewType: ResultsViewType;
  setResultsViewType: (viewType: ResultsViewType) => void;
};

function DocumentResultsView({
  onClearError,

  queryText,

  resultState,
  resultErrorMessage,
  resultDocuments,
  resultsViewType,

  setResultsViewType
}: DocumentResultsViewProps): React.ReactElement {
  switch (resultState) {
    case 'awaiting-run': {
      return (
        <div>
        </div>
      );
    }
    case 'loading': {
      return (
        <div className={loadingContainerStyles}>
          <SpinLoader />
        </div>
      );
    }
    case 'loaded': {
      return (
        <div>
          <div className={resultsHeaderStyles}>
            <DocumentResultsHeader
              queryText={queryText}
              resultsView={resultsViewType}
              onChangeResultsView={setResultsViewType}
            />
          </div>
          <div className={resultsStyles}>
            <DocumentList
              documents={resultDocuments || [] as Document[]}
              view={resultsViewType} 
            />
          </div>
        </div>
      );
    }
    case 'error': {
      return (
        <div className={resultsHeaderStyles}>
          <Banner
            variant="danger"
            dismissible
            onClose={onClearError}
          >
            {resultErrorMessage}
          </Banner>
        </div>
      );
    }
  }
}

export { DocumentResultsView };
