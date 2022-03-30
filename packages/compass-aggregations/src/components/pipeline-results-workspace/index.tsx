import React from 'react';
import { connect } from 'react-redux';
import type { Document } from 'mongodb';
import {
  IconButton,
  css,
  spacing,
  Icon,
  Button,
} from '@mongodb-js/compass-components';

import type { RootState } from '../../modules';
import {
  fetchNextPage,
  fetchPrevPage,
  cancelAggregation,
} from '../../modules/aggregation';

type PipelineResultsWorkspace = {
  documents: Document[];
  page: number;
  perPage: number;
  loading: boolean;
  isPrevDisabled: boolean;
  isNextDisabled: boolean;
  error?: string;
  onPrev: () => void;
  onNext: () => void;
  onCancel: () => void;
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
    loading,
    isPrevDisabled,
    isNextDisabled,
    error,
    onPrev,
    onNext,
    onCancel,
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
        {error && <p>{error}</p>}
        {loading && (
          <>
            <p>Loading ...</p>
            <Button onClick={() => onCancel()}>Cancel</Button>
          </>
        )}
        <pre>
          <code>{JSON.stringify(documents, null, 2)}</code>
        </pre>
      </div>
    );
  };

const mapState = ({
  aggregation: { documents, isLast, page, limit, loading, error },
}: RootState) => ({
  documents,
  page,
  perPage: limit,
  error,
  loading,
  isPrevDisabled: page <= 1,
  isNextDisabled: isLast,
});

const mapDispatch = {
  onPrev: fetchPrevPage,
  onNext: fetchNextPage,
  onCancel: cancelAggregation,
};

export default connect(mapState, mapDispatch)(PipelineResultsWorkspace);
