import React from 'react';
import { connect } from 'react-redux';
import {
  css,
  spacing,
  Body,
  Link,
  uiColors,
  Tooltip,
  SpinLoader,
} from '@mongodb-js/compass-components';

import type { RootState } from '../../modules';
import { countDocuments } from '../../modules/count-documents';

type PipelinePaginationCountProps = {
  loading: boolean;
  count?: number;
  onCount: () => void;
};

const countButtonStyles = css({
  backgroundColor: 'transparent',
  border: 'none',
  display: 'inline',
  height: spacing[4] + spacing[1],
  ':focus': {
    outline: `${spacing[1]}px auto ${uiColors.focus}`,
  },
});

export const PipelinePaginationCount: React.FunctionComponent<PipelinePaginationCountProps> =
  ({ loading, count, onCount }) => {
    const countDefinition = `
      In order to have the final count of documents we need to run the
      aggregation again. This will be the equivalent of adding a
      $count as the last stage of the pipeline.
    `;

    const testId = 'pipeline-pagination-count';

    if (loading) {
      return (
        <div data-testid={testId}>
          <SpinLoader />
        </div>
      );
    }

    if (count !== undefined) {
      return (
        <div data-testid={testId}>
          <Body>of {count}</Body>
        </div>
      );
    }

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
};

export default connect(mapState, mapDispatch)(PipelinePaginationCount);
