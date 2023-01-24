import React from 'react';
import { connect } from 'react-redux';
import {
  css,
  spacing,
  Body,
  Link,
  palette,
  Tooltip,
  SpinLoader,
  IconButton,
  Icon,
} from '@mongodb-js/compass-components';

import type { RootState } from '../../modules';
import { countDocuments } from '../../modules/count-documents';

type PipelinePaginationCountProps = {
  loading: boolean;
  count?: number;
  onCount: () => void;
  onRefresh: () => void;
};

const countButtonStyles = css({
  backgroundColor: 'transparent',
  border: 'none',
  display: 'inline',
  height: spacing[4] + spacing[1],
  ':focus': {
    outline: `${spacing[1]}px auto ${palette.blue.light1}`,
  },
});

const countDocsContainerStyles = css({
  display: 'flex',
  alignItems: 'center',
});

// As we want to align the refresh button and loader icon,
// we need to set the same size as the IconButton.
const spinnerStyles = css({
  width: spacing[4] + spacing[1], // LG IconButton width
  height: spacing[4] + spacing[1], // LG IconButton height
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
});

const countDefinition = `
  In order to have the final count of documents we need to run the
  aggregation again. This will be the equivalent of adding a
  $count as the last stage of the pipeline.
`;
const testId = 'pipeline-pagination-count';

const StyledSpinner = ({ title }: { title: string }) => (
  <div className={spinnerStyles} title={title}>
    <SpinLoader />
  </div>
);

export const PipelinePaginationCount: React.FunctionComponent<
  PipelinePaginationCountProps
> = ({ loading, count, onCount, onRefresh }) => {
  // User has clicked on the count results button. Show the count loader.
  if (loading && count === undefined) {
    return (
      <div data-testid={testId}>
        <StyledSpinner title="Counting documents" />
      </div>
    );
  }

  // Show the count and the loader / refresh button.
  if (count !== undefined) {
    return (
      <div data-testid={testId} className={countDocsContainerStyles}>
        <Body>of {count}</Body>
        {loading ? (
          <StyledSpinner title="Refreshing document count" />
        ) : (
          <IconButton
            aria-label="Refresh document count"
            title="Refresh document count"
            data-testid="pipeline-pagination-refresh-count-action"
            onClick={onRefresh}
          >
            <Icon glyph="Refresh" />
          </IconButton>
        )}
      </div>
    );
  }

  // User has not interacted with the count yet. Show a button with tooltip.
  return (
    <div data-testid={testId}>
      <Tooltip
        trigger={({ children, ...props }) => (
          <Link
            {...props}
            aria-label={'count results'}
            as="button"
            data-testid="pipeline-pagination-count-action"
            hideExternalIcon={true}
            className={countButtonStyles}
            onClick={() => onCount()}
          >
            {children}
            count results
          </Link>
        )}
      >
        <Body>{countDefinition}</Body>
      </Tooltip>
    </div>
  );
};

const mapState = ({ countDocuments: { loading, count } }: RootState) => ({
  loading,
  count,
});

const mapDispatch = {
  onCount: countDocuments,
  onRefresh: countDocuments,
};

export default connect(mapState, mapDispatch)(PipelinePaginationCount);
