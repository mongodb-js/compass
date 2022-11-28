import React from 'react';
import PropTypes from 'prop-types';

/**
 Custom cell renderer for the row numbers. Required because we can't rely on
 the ag-cell-last-left-pinned CSS class because on nested views the ObjectId
 is the last pinned column.
 */
function RowNumberRenderer({
  value,
}: {
  value: JSX.Element | string | number;
}) {
  return <div className="table-view-cell-row-number">{value}</div>;
}

RowNumberRenderer.propTypes = {
  value: PropTypes.any,
};

RowNumberRenderer.displayName = 'RowNumberRenderer';

export default RowNumberRenderer;
