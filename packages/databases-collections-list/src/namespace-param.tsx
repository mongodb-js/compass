/* eslint-disable react/prop-types */
import React, { useMemo } from 'react';
import {
  InlineDefinition,
  spacing,
  css,
  cx,
  ContentWithFallback,
  Placeholder,
  keyframes,
} from '@mongodb-js/compass-components';
import { ViewType } from './use-view-type';

const namespaceParam = css({
  display: 'flex',
  gap: '1ch',
  flex: 1,
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  minWidth: 0,
  maxWidth: spacing[6] * 4,
});

const multiline = css({
  display: 'flex',
  flexDirection: 'column',
  gap: 0,
});

const namespaceParamLabel = css({
  fontWeight: 'bold',
});

const namespaceParamValueContainer = css({
  position: 'relative',
  width: '100%',
});

const namespaceParamValue = css({
  opacity: 1,
  transition: 'opacity .16s linear',
});

const namespaceParamValueRefreshing = css({
  opacity: 0.3,
});

const namespaceParamValueError = css({
  opacity: 0.3,
});

const namespaceParamValuePlaceholder = css({
  position: 'absolute',
  top: 0,
  left: 0,
  opacity: 0,
  transition: 'opacity .16s ease-out',
});

const visible = css({
  opacity: 1,
  transitionTimingFunction: 'ease-in',
});

const fadeInAnimation = keyframes({
  from: {
    opacity: 0,
  },
  to: {
    opacity: 1,
  },
});

const fadeIn = css({
  animation: `${fadeInAnimation} .16s ease-out`,
});

export const NamespaceParam: React.FunctionComponent<{
  label: React.ReactNode;
  value: React.ReactNode;
  status: string;
  hint?: React.ReactNode;
  viewType: ViewType;
}> = ({ label, value, status, hint, viewType }) => {
  const renderedValue = useMemo(() => {
    const isReady = status !== 'initial' && status !== 'fetching';
    return (
      <ContentWithFallback
        isContentReady={isReady}
        content={(shouldRender, shouldAnimate) => {
          if (!shouldRender) {
            return null;
          }

          return (
            <span
              className={cx(
                namespaceParamValue,
                status === 'error' && namespaceParamValueError,
                status === 'refreshing' && namespaceParamValueRefreshing,
                shouldAnimate && fadeIn
              )}
            >
              {status === 'error' ? '—' : value}
            </span>
          );
        }}
        fallback={(shouldRender) => (
          <Placeholder
            maxChar={10}
            className={cx(
              namespaceParamValuePlaceholder,
              shouldRender && visible
            )}
          ></Placeholder>
        )}
      ></ContentWithFallback>
    );
  }, [value, status]);

  return (
    <div className={cx(namespaceParam, viewType === 'list' && multiline)}>
      <span className={namespaceParamLabel}>
        {hint ? (
          <InlineDefinition align="top" justify="start" definition={hint}>
            {label}:
          </InlineDefinition>
        ) : (
          <>{label}:</>
        )}
      </span>
      <span className={namespaceParamValueContainer}>{renderedValue}</span>
    </div>
  );
};
