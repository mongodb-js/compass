import { css } from '@mongodb-js/compass-components';
// import { globalStyle, style } from '@vanilla-extract/css';

export const diagramStyle = css({
  height: '100%',
  width: '100%',
  // Our modals are not clickable because react-flow sets a zIndex @see https://github.com/wbkd/react-flow/issues/1005
  zIndex: 0,
});

/**
 * Customise attribution styles
 */

// globalStyle(`${diagramStyle} > .react-flow__attribution`, {
//   backgroundColor: 'unset',
//   userSelect: 'none',
// });

// globalStyle(`${diagramStyle} > .react-flow__attribution > a`, {
//   fontWeight: 'unset',
// });

// globalStyle('.react-flow__nodesselection-rect', {
//   background: 'unset',
//   border: 'unset',
// });

// globalStyle('.react-flow__panel', {
//   margin: `${spacing[3]}px`,
// });

export const isSweepingStyle = css({
  cursor: 'crosshair',
});
