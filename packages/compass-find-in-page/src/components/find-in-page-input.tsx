import React, { useCallback, useEffect, useRef } from 'react';
import {
  TextInput,
  IconButton,
  Icon,
  Body,
  withTheme,
  css,
  cx,
  spacing,
  palette,
} from '@mongodb-js/compass-components';

const findInPageContainerStyles = css({
  borderRadius: '0 0 5px 5px',
  border: '1px solid',
  borderTop: 'none',
  position: 'fixed',
  zIndex: 4,
  top: 0,
  right: spacing[4],
  width: spacing[6] * 4, // 256px
  boxShadow: '0px 2px 5px rgba(0, 30, 43, 0.3)',
});

const containerLightThemeStyles = css({
  background: palette.gray.light3,
  borderColor: palette.gray.light2,
});

const containerDarkThemeStyles = css({
  background: palette.gray.dark2,
  borderColor: palette.gray.dark1,
});

const descriptionStyles = css({
  paddingLeft: spacing[2],
  paddingTop: spacing[2],
  fontSize: '11px',
});

const descriptionLightThemeStyles = css({
  color: palette.gray.dark1,
});

const descriptionDarkThemeStyles = css({
  color: palette.gray.light2,
});

const findStyles = css({
  display: 'flex',
  justifyContent: 'space-between',
  flexDirection: 'row',
  alignItems: 'center',
});

const formStyles = css({
  padding: spacing[2],
  paddingRight: spacing[1],
  flex: 1,
});

const closeButtonStyles = css({
  margin: `0px ${spacing[1]}px`,
});

type FindInPageInputProps = {
  darkMode?: boolean;
  dispatchStopFind: () => void;
  setSearchTerm: (searchTerm: string) => void;
  dispatchFind: (
    searchTerm: string,
    isDirectionInversed: boolean,
    searching: boolean
  ) => void;
  toggleStatus: () => void;
  searchTerm: string;
  searching: boolean;
};

function FindInPageInput({
  darkMode,
  dispatchStopFind,
  setSearchTerm,
  dispatchFind,
  toggleStatus,
  searchTerm,
  searching,
}: FindInPageInputProps) {
  const findInPageInputRef = useRef<HTMLInputElement | null>(null);

  const onSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
    },
    [setSearchTerm]
  );

  const onClose = useCallback(() => {
    dispatchStopFind();
    setSearchTerm('');
    toggleStatus();
  }, [dispatchStopFind, setSearchTerm, toggleStatus]);

  const onKeyDown = useCallback(
    (evt: KeyboardEvent) => {
      if (evt.key === 'Escape') {
        onClose();
      }

      if (evt.key === 'Enter') {
        evt.preventDefault();
        const searchValue = findInPageInputRef.current?.value;
        if (!searchValue || searchValue === '') {
          return dispatchStopFind();
        }

        const back = evt.shiftKey;
        dispatchFind(searchValue, !back, searching);
      }
    },
    [onClose, dispatchFind, searching, dispatchStopFind]
  );

  useEffect(() => {
    findInPageInputRef.current?.focus();
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onKeyDown]);

  return (
    <div
      className={cx(
        findInPageContainerStyles,
        darkMode ? containerDarkThemeStyles : containerLightThemeStyles
      )}
    >
      <Body
        className={cx(
          descriptionStyles,
          darkMode ? descriptionDarkThemeStyles : descriptionLightThemeStyles
        )}
        id="find-in-page-label"
      >
        Use (Shift+) Enter to navigate results.
      </Body>
      <div className={findStyles}>
        <form
          name="find-in-page"
          data-testid="find-in-page-form"
          className={formStyles}
        >
          <TextInput
            type="text"
            aria-label="Find in page"
            aria-labelledby="find-in-page-label"
            ref={findInPageInputRef}
            onChange={onSearchChange}
            value={searchTerm}
          />
        </form>
        <IconButton
          className={closeButtonStyles}
          aria-label="Close find box"
          onClick={onClose}
          onKeyDown={(evt) => {
            // So that enter / space works as a trigger on the button instead of
            // window keydown event handler reacting to Enter press
            evt.stopPropagation();
          }}
        >
          <Icon glyph="X" role="presentation" />
        </IconButton>
      </div>
    </div>
  );
}

export default withTheme(FindInPageInput);
