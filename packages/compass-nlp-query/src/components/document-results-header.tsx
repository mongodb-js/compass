import React from 'react';
import { css, spacing } from '@mongodb-js/compass-components';

import type { ResultsViewType } from './document-list';
import { DocumentResultsViewControls } from './document-results-view-controls';

type DocumentResultsHeaderProps = {
  onChangeResultsView: (viewType: ResultsViewType) => void;
  resultsView: ResultsViewType;
};

const controlsStyles = css({
  display: 'flex',
  gap: spacing[2],
  justifyContent: 'flex-end',
  alignItems: 'center',
});

const DocumentResultsHeader: React.FunctionComponent<DocumentResultsHeaderProps> =
  ({ onChangeResultsView, resultsView }) => {
    return (
      <div>
        <div className={controlsStyles}>
          <DocumentResultsViewControls
            value={resultsView}
            onChange={onChangeResultsView}
          />
        </div>
      </div>
    );
  };

export { DocumentResultsHeader };
