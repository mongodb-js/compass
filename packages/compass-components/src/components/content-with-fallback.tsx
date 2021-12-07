/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react';

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
