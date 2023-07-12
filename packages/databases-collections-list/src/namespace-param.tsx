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
  SignalPopover,
} from '@mongodb-js/compass-components';
import type { ViewType } from './use-view-type';
import { usePreference } from 'compass-preferences-model';

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
  // Keeping container height for the placeholder to appear
  minHeight: 20,
});

const namespaceParamValueContainerWithInsights = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[2],
});

const namespaceParamValue = css({
  opacity: 1,
  transition: 'opacity .16s linear',
});

const namespaceParamValueRefreshing = css({
  opacity: 0.3,
});

const namespaceParamValueMissing = css({
  opacity: 0.3,
});

const namespaceParamValuePlaceholder = css({
  position: 'absolute',
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
  display: 'flex',
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
  status: 'initial' | 'fetching' | 'refreshing' | 'ready' | 'error';
  hint?: React.ReactNode;
  viewType: ViewType;
  insights?: React.ComponentProps<typeof SignalPopover>['signals'];
}> = ({ label, value, status, hint, viewType, insights }) => {
  const showInsights = usePreference('showInsights', React);

  const renderedValue = useMemo(() => {
    const isReady = status !== 'initial' && status !== 'fetching';
    return (
      <ContentWithFallback
        isContentReady={isReady}
        content={(shouldRender, shouldAnimate) => {
          if (!shouldRender) {
            return null;
          }

          // eslint-disable-next-line eqeqeq
          const missingValue = value == null || status === 'error';

          return (
            <span
              className={cx(
                namespaceParamValue,
                missingValue && namespaceParamValueMissing,
                status === 'refreshing' && namespaceParamValueRefreshing,
                shouldAnimate && fadeIn
              )}
            >
              {missingValue ? '—' : value}
            </span>
          );
        }}
        fallback={(shouldRender) => (
          <span
            className={cx(
              namespaceParamValuePlaceholder,
              shouldRender && visible
            )}
          >
            <Placeholder maxChar={10}></Placeholder>
          </span>
        )}
      ></ContentWithFallback>
    );
  }, [value, status]);

  return (
    <div className={cx(namespaceParam, viewType === 'list' && multiline)}>
      <span className={namespaceParamLabel}>
        {hint ? (
          <InlineDefinition
            tooltipProps={{
              align: 'top',
              justify: 'start',
              delay: 500,
            }}
            definition={hint}
          >
            {label}:
          </InlineDefinition>
        ) : (
          <>{label}:</>
        )}
      </span>
      <span
        className={cx(
          namespaceParamValueContainer,
          insights && namespaceParamValueContainerWithInsights
        )}
      >
        {renderedValue}
        {showInsights && insights && (
          <SignalPopover signals={insights}></SignalPopover>
        )}
      </span>
    </div>
  );
};
