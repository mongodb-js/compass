import React, { useCallback, useEffect, useRef } from 'react';
import {
  TextInput,
  IconButton,
  Icon,
  Body,
  useDarkMode,
  css,
  cx,
  spacing,
  palette,
  rgba,
  useHotkeys,
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
  boxShadow: `0px 2px 5px ${rgba(palette.black, 0.3)}`,
});

const containerLightThemeStyles = css({
  background: palette.gray.light3,
  borderColor: palette.gray.light2,
});

const containerDarkThemeStyles = css({
  background: palette.black,
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
  dispatchStopFind: () => void;
  setSearchTerm: (searchTerm: string) => void;
  dispatchFind: (
    searchTerm: string,
    isForwardSearch: boolean,
    searching: boolean
  ) => void;
  toggleStatus: () => void;
  searchTerm: string;
  searching: boolean;
};

function FindInPageInput({
  dispatchStopFind,
  setSearchTerm,
  dispatchFind,
  toggleStatus,
  searchTerm,
  searching,
}: FindInPageInputProps) {
  const darkMode = useDarkMode();
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

  const onFind = useCallback(
    (evt: KeyboardEvent, isForwardSearch: boolean) => {
      evt.preventDefault();
      const searchValue = findInPageInputRef.current?.value;
      if (!searchValue || searchValue === '') {
        return dispatchStopFind();
      }
      dispatchFind(searchValue, isForwardSearch, searching);
    },
    [dispatchFind, searching, dispatchStopFind]
  );
  const findNext = useCallback(
    (evt: KeyboardEvent) => onFind(evt, true),
    [onFind]
  );
  const findPrev = useCallback(
    (evt: KeyboardEvent) => onFind(evt, false),
    [onFind]
  );

  useHotkeys('esc', onClose, { enableOnFormTags: ['INPUT'] });
  useHotkeys('enter', findNext, { enableOnFormTags: ['INPUT'] });
  useHotkeys('shift + enter', findPrev, { enableOnFormTags: ['INPUT'] });

  useEffect(() => {
    findInPageInputRef.current?.focus();
  }, []);

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
          onKeyDown={(evt: React.KeyboardEvent) => {
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

export default FindInPageInput;
