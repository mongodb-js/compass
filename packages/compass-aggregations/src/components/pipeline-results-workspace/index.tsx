import React from 'react';
import { connect } from 'react-redux';
import type { Document } from 'mongodb';
import {
  IconButton,
  css,
  spacing,
  Icon,
  Button,
  Body,
  uiColors,
  cx,
} from '@mongodb-js/compass-components';

import type { RootState } from '../../modules';
import {
  fetchNextPage,
  fetchPrevPage,
  cancelAggregation,
} from '../../modules/aggregation';
import { PipelineResultsList } from './pipeline-results-list';

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

const centeredContentStyles = css({
  textAlign: 'center',
  marginTop: spacing[4],
});

const errorMessageStyles = css({
  color: uiColors.red.base,
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
    const showingTo = showingFrom + (documents.length || perPage);
    return (
      <div data-testid="pipeline-results-workspace">
        <div className={topStyles}>
          <Body>
            Showing {showingFrom + 1} – {showingTo}
          </Body>
          <div>
            <IconButton
              aria-label="Previous page"
              disabled={isPrevDisabled || loading}
              onClick={() => onPrev()}
            >
              <Icon glyph="ChevronLeft" />
            </IconButton>
            <IconButton
              aria-label="Next page"
              disabled={isNextDisabled || loading}
              onClick={() => onNext()}
            >
              <Icon glyph="ChevronRight" />
            </IconButton>
          </div>
        </div>
        <PipelineResultsList
          documents={documents}
          data-testid="pipeline-results-workspace"
        ></PipelineResultsList>
        {error && (
          <Body className={cx(centeredContentStyles, errorMessageStyles)}>
            {error}
          </Body>
        )}
        {loading && (
          <div className={centeredContentStyles}>
            <Body>Loading ... </Body>
            <Button
              onClick={() => onCancel()}
              variant="primaryOutline"
              size="xsmall"
            >
              Cancel
            </Button>
          </div>
        )}
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
