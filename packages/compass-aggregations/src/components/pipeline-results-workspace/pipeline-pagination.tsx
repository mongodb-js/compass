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
  documentCount: number;
  page: number;
  perPage: number;
  loading: boolean;
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
    documentCount,
    page,
    perPage,
    loading,
    isPrevDisabled,
    isNextDisabled,
    onPrev,
    onNext,
  }) => {
    const showingFrom = (page - 1) * perPage;
    const showingTo = showingFrom + (documentCount || perPage);
    return (
      <div className={containerStyles}>
        {!loading && (
          <Body>
            Showing {showingFrom + 1} – {showingTo}
          </Body>
        )}
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
    );
  };

const mapState = ({
  aggregation: { documents, isLast, page, limit, loading, error },
}: RootState) => ({
  documentCount: documents.length,
  page,
  perPage: limit,
  error,
  loading,
  isPrevDisabled: page <= 1 || loading || Boolean(error),
  isNextDisabled: isLast || loading || Boolean(error),
});

const mapDispatch = {
  onPrev: fetchPrevPage,
  onNext: fetchNextPage,
};

export default connect(mapState, mapDispatch)(PipelinePagination);
