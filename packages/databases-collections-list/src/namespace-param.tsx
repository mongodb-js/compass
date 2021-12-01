/* eslint-disable react/prop-types */
import React, { useMemo } from 'react';
import {
  InlineDefinition,
  spacing,
  css,
  cx,
} from '@mongodb-js/compass-components';

const namespaceParam = css({
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  marginTop: spacing[2],
});

const namespaceParamLabel = css({
  fontWeight: 'bold',
});

const namespaceParamValue = css({
  opacity: 1,
  transition: 'opacity .16s linear',
});

const namespaceParamValueRefreshing = css({
  opacity: 0.3,
});

const namespaceParamValuePlaceholder = css({});

export const NamespaceParam: React.FunctionComponent<{
  label: React.ReactNode;
  value: React.ReactNode;
  status: string;
  hint?: React.ReactNode;
}> = ({ label, value, status, hint }) => {
  const renderedValue = useMemo(() => {
    return status === 'ready' || status === 'refreshing' ? (
      <span
        className={cx(
          namespaceParamValue,
          status === 'refreshing' && namespaceParamValueRefreshing
        )}
      >
        {value}
      </span>
    ) : status === 'error' ? (
      <span className={namespaceParamValue}>—</span>
    ) : (
      <span className={namespaceParamValuePlaceholder}></span>
    );
  }, [value, status]);

  return (
    <div className={namespaceParam}>
      <span className={namespaceParamLabel}>
        {hint ? (
          <InlineDefinition align="top" justify="start" definition={hint}>
            {label}:
          </InlineDefinition>
        ) : (
          <>{label}:</>
        )}
      </span>
      &nbsp;{renderedValue}
    </div>
  );
};
