import React from 'react';
import { connect } from 'react-redux';
import {
  IconButton,
  css,
  spacing,
  Icon,
  Body,
} from '@mongodb-js/compass-components';

import type { RootState } from '../../modules';
import { fetchNextPage, fetchPrevPage } from '../../modules/aggregation';

type PipelinePaginationProps = {
  showingFrom: number;
  showingTo: number;
  isCountDisabled: boolean;
  isPrevDisabled: boolean;
  isNextDisabled: boolean;
  onPrev: () => void;
  onNext: () => void;
};

const containerStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[2],
});

export const PipelinePagination: React.FunctionComponent<PipelinePaginationProps> =
  ({
    showingFrom,
    showingTo,
    isCountDisabled,
    isPrevDisabled,
    isNextDisabled,
    onPrev,
    onNext,
  }) => {
    return (
      <div className={containerStyles} data-testid="pipeline-pagination">
        {!isCountDisabled && (
          <Body data-testid="pipeline-pagination-desc">
            Showing {showingFrom} – {showingTo}
          </Body>
        )}
        <div>
          <IconButton
            data-testid="pipeline-pagination-prev-action"
            aria-label="Previous page"
            disabled={isPrevDisabled}
            onClick={() => onPrev()}
          >
            <Icon glyph="ChevronLeft" />
          </IconButton>
          <IconButton
            data-testid="pipeline-pagination-next-action"
            aria-label="Next page"
            disabled={isNextDisabled}
            onClick={() => onNext()}
          >
            <Icon glyph="ChevronRight" />
          </IconButton>
        </div>
      </div>
    );
  };

export const calculateShowingFrom = ({
  limit,
  page,
}: Pick<RootState['aggregation'], 'limit' | 'page'>): number => {
  return (page - 1) * limit + 1;
};

export const calculateShowingTo = ({
  limit,
  page,
  documentCount,
}: Pick<RootState['aggregation'], 'limit' | 'page'> & {
  documentCount: number;
}): number => {
  return (page - 1) * limit + (documentCount || limit);
};

const mapState = ({
  aggregation: { documents, isLast, page, limit, loading, error },
}: RootState) => ({
  showingFrom: calculateShowingFrom({ limit, page }),
  showingTo: calculateShowingTo({
    limit,
    page,
    documentCount: documents.length,
  }),
  isCountDisabled: Boolean(error),
  isPrevDisabled: page <= 1 || loading || Boolean(error),
  isNextDisabled: isLast || loading || Boolean(error),
});

const mapDispatch = {
  onPrev: fetchPrevPage,
  onNext: fetchNextPage,
};

export default connect(mapState, mapDispatch)(PipelinePagination);
