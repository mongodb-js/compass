import React, { useCallback, useState, useEffect } from 'react';
import {
  ResizeHandle,
  ResizeDirection,
  useTheme,
  Theme,
  css,
  cx,
} from '../index';

import { uiColors } from '@leafygreen-ui/palette';
import { spacing } from '@leafygreen-ui/tokens';

const containerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  margin: 0,
  padding: 0,
  maxWidth: '80%',
  height: '100%',
  position: 'relative',
});

const containerStylesDark = css({
  '--color': 'white',
  '--bg-color': uiColors.gray.dark3,

  '--title-color': uiColors.gray.dark3,
  '--title-bg-color': '#71F6BA', // TODO: there is no uiColors.green.light1,

  '--icon-color': 'white',

  '--item-color': 'white',
  '--item-color-active': '#71F6BA', // TODO: there is no uiColors.green.light1
  '--item-bg-color': uiColors.gray.dark3,
  '--item-bg-color-active': uiColors.black,

  color: 'var(--color)',
  backgroundColor: 'var(--bg-color)',
});

const containerStylesLight = css({
  '--color': uiColors.gray.dark3,
  '--bg-color': uiColors.gray.light3,

  '--title-color': 'white',
  '--title-bg-color': uiColors.green.dark2,

  '--icon-color': uiColors.gray.dark3,

  '--item-color': uiColors.gray.dark3,
  '--item-color-active': uiColors.green.dark2,
  '--item-bg-color': uiColors.gray.light3,
  '--item-bg-color-active': uiColors.green.light3,

  color: 'var(--color)',
  backgroundColor: 'var(--bg-color)',
});

const ResizableSidebar = ({
  collapsable = false,
  expanded = true,
  setExpanded = () => {
    return;
  },
  initialWidth = spacing[6] * 4,
  minWidth = 210,
  collapsedWidth = 48,
  children,
}: {
  collapsable?: boolean;
  expanded?: boolean;
  setExpanded?: (isExpaned: boolean) => void;
  initialWidth?: number;
  minWidth?: number;
  collapsedWidth?: number;
  children: JSX.Element;
}): JSX.Element => {
  const [width, setWidth] = useState(initialWidth);
  const [prevWidth, setPrevWidth] = useState(initialWidth);

  const getMaxSidebarWidth = useCallback(() => {
    return Math.max(minWidth, window.innerWidth - 100);
  }, [minWidth]);

  // Apply bounds to the sidebar width when resizing to ensure it's always
  // visible and usable to the user.
  const boundSidebarWidth = useCallback(
    (attemptedWidth: number) => {
      const maxWidth = getMaxSidebarWidth();

      return Math.min(maxWidth, Math.max(minWidth, attemptedWidth));
    },
    [getMaxSidebarWidth, minWidth]
  );

  const updateWidth = useCallback(
    (newWidth: number) => {
      setWidth(newWidth);

      const expectedExpanded = width > minWidth || !collapsable;
      if (expanded !== expectedExpanded) {
        setExpanded(expectedExpanded);
      }

      // Keep the most recent expanded width in case the sidebar suddenly gets
      // collapsed (via a button or keyboard shortcut or similar) so that if it
      // gets similarly expanded later we can restore the width.
      if (expectedExpanded) {
        setPrevWidth(newWidth);
      }
    },
    [collapsable, expanded, minWidth, setExpanded, width]
  );

  const renderedWidth = expanded ? boundSidebarWidth(width) : collapsedWidth;

  useEffect(() => {
    if (expanded && width === collapsedWidth) {
      setWidth(prevWidth);
    }
  }, [setWidth, prevWidth, expanded, width, collapsedWidth]);

  const { theme } = useTheme();

  return (
    <div
      className={cx(
        containerStyles,
        theme === Theme.Dark ? containerStylesDark : containerStylesLight
      )}
      style={{
        minWidth: collapsable ? collapsedWidth : minWidth,
        width: renderedWidth,
        flex: 'none',
      }}
    >
      {children}
      <ResizeHandle
        onChange={updateWidth}
        direction={ResizeDirection.RIGHT}
        value={width}
        minValue={collapsable ? collapsedWidth : minWidth}
        maxValue={getMaxSidebarWidth()}
        title="sidebar"
      />
    </div>
  );
};

export default ResizableSidebar;
