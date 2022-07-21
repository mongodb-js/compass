import type { ReactNode } from 'react';
import React, { useEffect, useState } from 'react';
import {
  css,
  cx,
  keyframes,
  spacing,
  ThemeProvider,
} from '@mongodb-js/compass-components';

const containerStyles = css({
  display: 'none',
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 10000,
  textAlign: 'center'
});

const inputContainerStyles = css({
  margin: `${spacing[6]}px auto`,
  maxWidth: spacing[7] * 10,
  textAlign: 'left',
  background: 'white',
})

const containerVisibleStyles = css({
  display: 'block', // flex
});

const fadeInAnimation = keyframes({
  from: {
    opacity: 0,
  },
  to: {
    opacity: 1,
  },
});

const backgroundStyles = css({
  position: 'absolute',
  left: 0,
  bottom: 0,
  top: 0,
  right: 0,
  zIndex: -1,
  
  background: 'rgba(0, 0, 0, 0.28)',
  // opacity: 0,
  // transition: 'opacity .16s ease-out',
  animation: `${fadeInAnimation} .16s ease-out`,
})

const CommandPalette: React.FunctionComponent<{
  children: ReactNode
}> = ({
  children
}) => {
  const [ isOpen, setIsOpen ] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      console.log('onkeydown', event.key);
      if (event.key === 'p' && event.shiftKey && event.metaKey) {
        setIsOpen(!isOpen);
      }
    }
    
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [ isOpen ]);

  return (
    <div
      className={cx(containerStyles, isOpen && containerVisibleStyles)}
    >
      {/* eslint-disable jsx-a11y/interactive-supports-focus */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events */}
      <div
        className={backgroundStyles}
        onClick={() => setIsOpen(false)}
        role="button"
      />
      {/* eslint-enable jsx-a11y/interactive-supports-focus */}
      {isOpen && (
        <div
          className={inputContainerStyles}
        >
          <ThemeProvider theme={{ theme: 'Dark' } as any}>
            {children}
          </ThemeProvider>
        </div>
      )}
    </div>
  );
};

export { CommandPalette };
