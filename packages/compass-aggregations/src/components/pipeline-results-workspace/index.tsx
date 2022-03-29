import React from 'react';
import { connect } from 'react-redux';
import type { Document } from 'mongodb';
import { IconButton, css, spacing, Icon } from '@mongodb-js/compass-components';

import type { RootState } from '../../modules';
import { fetchNextPage, fetchPrevPage } from '../../modules/aggregation';

type PipelineResultsWorkspace = {
  documents: Document[];
  page: number;
  perPage: number;
  isPrevDisabled: boolean;
  isNextDisabled: boolean;
  onPrev: () => void;
  onNext: () => void;
};

const topStyles = css({
  display: 'flex',
  justifyContent: 'flex-end',
  alignItems: 'center',
  gap: spacing[2],
});

const PipelineResultsWorkspace: React.FunctionComponent<PipelineResultsWorkspace> =
  ({
    documents,
    page,
    perPage,
    isPrevDisabled,
    isNextDisabled,
    onPrev,
    onNext,
  }) => {
    const showingFrom = (page - 1) * perPage;
    const showingTo = showingFrom + documents.length;
    return (
      <div data-testid="pipeline-results-workspace">
        <div className={topStyles}>
          <p>
            Showing {showingFrom || 1} - {showingTo}
            &nbsp;of count.
          </p>
          <div>
            <IconButton
              aria-label="Previous page"
              disabled={isPrevDisabled}
              onClick={() => onPrev()}
            >
              <Icon glyph="ChevronLeft" />
            </IconButton>
            <IconButton
              aria-label="Next page"
              disabled={isNextDisabled}
              onClick={() => onNext()}
            >
              <Icon glyph="ChevronRight" />
            </IconButton>
          </div>
        </div>
        <pre>
          <code>
            {JSON.stringify(
              documents.map((document, index) => ({
                index: index + 1,
                ...document,
              })),
              null,
              2
            )}
          </code>
        </pre>
      </div>
    );
  };

const mapState = ({
  aggregation: { documents, isLast, page, limit },
}: RootState) => ({
  documents,
  page,
  perPage: limit,
  isPrevDisabled: page <= 1,
  isNextDisabled: isLast,
});

const mapDispatch = {
  onPrev: fetchPrevPage,
  onNext: fetchNextPage,
};

export default connect(mapState, mapDispatch)(PipelineResultsWorkspace);
