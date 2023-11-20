/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react';
import { css, cx, keyframes } from '@leafygreen-ui/emotion';

enum RenderStatus {
  Nothing = 'Nothing',
  Fallback = 'Fallback',
  Content = 'Content',
  // If content is appearing after fallback was displayed, we want to signal
  // this so that content might want to animate the transition
  ContentAnimated = 'ContentAnimated',
}
function isContent(status: RenderStatus): boolean {
  return [RenderStatus.ContentAnimated, RenderStatus.Content].includes(status);
}
function useRenderWithFallback(
  isContentReady: boolean,
  { contentAfterFallbackTimeout = 200, fallbackTimeout = 30 } = {}
) {
  const [renderStatus, setRenderStatus] = useState(
    isContentReady ? RenderStatus.Content : RenderStatus.Nothing
  );

  useEffect(() => {
    if (isContent(renderStatus)) {
      return;
    }
    if (isContentReady && renderStatus === RenderStatus.Nothing) {
      setRenderStatus(RenderStatus.Content);
      return;
    }
    if (isContentReady && renderStatus === RenderStatus.Fallback) {
      const timeout = setTimeout(() => {
        setRenderStatus(RenderStatus.ContentAnimated);
      }, contentAfterFallbackTimeout);
      return () => {
        clearTimeout(timeout);
      };
    }
    if (!isContentReady && renderStatus === RenderStatus.Nothing) {
      const timeout = setTimeout(() => {
        setRenderStatus(RenderStatus.Fallback);
      }, fallbackTimeout);
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [
    renderStatus,
    isContentReady,
    contentAfterFallbackTimeout,
    fallbackTimeout,
  ]);

  return renderStatus;
}
export const ContentWithFallback: React.FunctionComponent<{
  content(
    shouldRender: boolean,
    shouldAnimate: boolean
  ): React.ReactElement | boolean | null;
  fallback(shouldRender: boolean): React.ReactElement | boolean | null;
  isContentReady: boolean;
  contentAfterFallbackTimeout?: number;
  fallbackTimeout?: number;
}> = ({
  content,
  fallback,
  isContentReady,
  contentAfterFallbackTimeout,
  fallbackTimeout,
}) => {
  const renderStatus = useRenderWithFallback(isContentReady, {
    contentAfterFallbackTimeout,
    fallbackTimeout,
  });

  return (
    <>
      {content(
        isContent(renderStatus),
        renderStatus === RenderStatus.ContentAnimated
      )}
      {fallback(renderStatus === RenderStatus.Fallback)}
    </>
  );
};

const contentWithFallbackContainer = css({
  position: 'relative',
});

const fadeInAnimation = keyframes({
  from: {
    opacity: 0,
  },
  to: {
    opacity: 1,
  },
});

const contentContainer = css({
  position: 'relative',
});

const contentContainerFadeIn = css({
  animation: `${fadeInAnimation} .16s ease-out`,
});

const fallbackContainer = css({
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  pointerEvents: 'none',
  display: 'none',
});

const fallbackContainerVisible = css({
  display: 'block',
});

type FadeInPlaceholderProps = {
  isContentReady: boolean;
  content(): React.ReactElement | boolean | null;
  fallback(): React.ReactElement | boolean | null;
  contentContainerProps?: React.HTMLProps<HTMLDivElement>;
  fallbackContainerProps?: React.HTMLProps<HTMLDivElement>;
};

export const FadeInPlaceholder: React.FunctionComponent<
  FadeInPlaceholderProps &
    Omit<React.HTMLProps<HTMLDivElement>, keyof FadeInPlaceholderProps>
> = ({
  content,
  fallback,
  isContentReady,
  contentContainerProps = {},
  fallbackContainerProps = {},
  className,
  ...props
}) => {
  return (
    <div className={cx(contentWithFallbackContainer, className)} {...props}>
      <ContentWithFallback
        isContentReady={isContentReady}
        content={(shouldRender, shouldAnimate) => {
          return (
            shouldRender && (
              <div
                {...contentContainerProps}
                className={cx(
                  contentContainer,
                  shouldAnimate && contentContainerFadeIn,
                  contentContainerProps.className
                )}
              >
                {content()}
              </div>
            )
          );
        }}
        fallback={(shouldRender) => {
          return (
            <div
              {...fallbackContainerProps}
              className={cx(
                fallbackContainer,
                shouldRender && fallbackContainerVisible,
                fallbackContainerProps.className
              )}
            >
              {fallback()}
            </div>
          );
        }}
      ></ContentWithFallback>
    </div>
  );
};
