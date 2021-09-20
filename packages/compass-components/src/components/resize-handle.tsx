/** @jsx jsx */
import { css, jsx } from '@emotion/react';

const LEFT_ARROW_KEY = 'ArrowLeft';
const RIGHT_ARROW_KEY = 'ArrowRight';
const UP_ARROW_KEY = 'ArrowUp';
const DOWN_ARROW_KEY = 'ArrowDown';

const baseResizerStyles = css({
  position: 'absolute',
  background: 'transparent',
  left: 0,
  bottom: 0,
  right: 0,
  top: 0,
  padding: 0,
  transition: 'opacity 250ms ease',
  transitionDelay: '0ms',
  backgroundColor: '#019EE2',
  opacity: '0',
  outline: 'none',
  ':focus': {
    opacity: 1,
  },
});

const verticalResizerStyle = css({
  left: '3px',
  right: '3px',
});

const horizontalResizerStyle = css({
  top: '4px',
  bottom: '2px',
});

function ResizeHandleVertical({
  onMoveRightPressed,
  onMoveLeftPressed,
}: {
  onMoveRightPressed: () => void;
  onMoveLeftPressed: () => void;
}): React.ReactElement {
  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      css={[baseResizerStyles, verticalResizerStyle]}
      onKeyDown={(e) => {
        if (e.key === LEFT_ARROW_KEY) {
          onMoveLeftPressed();
        } else if (e.key === RIGHT_ARROW_KEY) {
          onMoveRightPressed();
        }
      }}
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      role="separator"
      aria-roledescription="vertical splitter"
    />
  );
}

function ResizeHandleHorizontal({
  onMoveUpPressed,
  onMoveDownPressed,
}: {
  onMoveUpPressed: () => void;
  onMoveDownPressed: () => void;
}): React.ReactElement {
  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      css={[baseResizerStyles, horizontalResizerStyle]}
      onKeyDown={(e) => {
        if (e.key === UP_ARROW_KEY) {
          onMoveUpPressed();
        } else if (e.key === DOWN_ARROW_KEY) {
          onMoveDownPressed();
        }
      }}
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      role="separator"
      aria-roledescription="horizontal splitter"
    />
  );
}

export { ResizeHandleHorizontal, ResizeHandleVertical };
