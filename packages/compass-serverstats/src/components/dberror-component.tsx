import React, { useCallback, useEffect, useState, useMemo } from 'react';
import type { Store } from 'reflux';
import {
  ErrorSummary,
  css,
  spacing,
  useTranslation,
} from '@mongodb-js/compass-components';

const errorContainerStyles = css({
  padding: spacing[200],
  position: 'relative',
});

/**
 * Represents the component that renders DB Errors.
 */
function DBErrorComponent({ store }: { store: Store }) {
  const t = useTranslation();
  const [data, setData] = useState<unknown[]>([]);

  const onRefresh = useCallback(
    (data: unknown[]) => {
      setData(data);
    },
    [setData]
  );

  const errors = useMemo(() => {
    return !data || data.length < 1
      ? []
      : (data as any[]).map((row) => {
          return t(
            'serverStats.dbError.commandFailed',
            'Command "{command}" returned error "{error}"',
            { command: row.ops, error: row.errorMsg }
          );
        });
  }, [data, t]);

  useEffect(() => {
    const unsubscribeRefresh = store.listen(onRefresh, store);

    return () => {
      unsubscribeRefresh();
    };
  }, [store, onRefresh]);

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
