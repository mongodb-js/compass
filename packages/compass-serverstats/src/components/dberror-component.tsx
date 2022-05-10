import React, { useCallback, useEffect, useState, useMemo } from 'react';
import type { Store } from 'reflux';
import { ErrorSummary, css, spacing } from '@mongodb-js/compass-components';

const errorContainerStyles = css({
  padding: spacing[2],
  position: 'relative'
});

/**
 * Represents the component that renders DB Errors.
 */
function DBErrorComponent({
  store
}: {
  store: Store 
}) {
  const [data, setData] = useState([]);

  const onRefresh = useCallback((data) => {
    setData(data);
  }, [setData]);

  const errors = useMemo(() => {
    return !data || data.length < 1
      ? []
      : data.map((row) => {
          return `Command "${row.ops}" returned error "${row.errorMsg}"`;
        });
  }, [data]);

  useEffect(() => {
    const unsubscribeRefresh = store.listen(onRefresh);

    return () => {
      unsubscribeRefresh();
    };
  }, [onRefresh]);

  if (!data || data.length < 1) {
    return null;
  }

  return (
    <div className={errorContainerStyles}>
      <ErrorSummary errors={errors} />
    </div>
  );
}

export { DBErrorComponent };
