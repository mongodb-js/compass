import React from 'react';
import { Body, css, spacing } from '@mongodb-js/compass-components';

import type { ResultsViewType } from './document-list';
import { DocumentResultsViewControls } from './document-results-view-controls';

type DocumentResultsHeaderProps = {
  onChangeResultsView: (viewType: ResultsViewType) => void;
  resultsView: ResultsViewType;
  queryText: string;
};

const controlsStyles = css({
  display: 'flex',
  gap: spacing[2],
  justifyContent: 'space-between',
  alignItems: 'center',
});

const DocumentResultsHeader: React.FunctionComponent<DocumentResultsHeaderProps> =
  ({
    onChangeResultsView,
    queryText,
    resultsView
  }) => {
    return (
      <div>
        <div className={controlsStyles}>
          <Body>
            Results for <strong>&apos;{queryText}&apos;</strong>
          </Body>
          <DocumentResultsViewControls
            value={resultsView}
            onChange={onChangeResultsView}
          />
        </div>
      </div>
    );
  };

export { DocumentResultsHeader };
