import {
  Body,
  css,
  cx,
  Icon,
  palette,
  useDarkMode,
} from '@mongodb-js/compass-components';
import React, { useState } from 'react';

const buttonLightThemeStyles = css({
  color: palette.gray.dark2,
});
const buttonDarkThemeStyles = css({
  color: palette.white,
});

const buttonStyles = css({
  fontWeight: 'bold',
  display: 'flex',
  alignItems: 'center',
  paddingLeft: 0,
  paddingRight: 0,
  border: 'none',
  background: 'none',
  boxShadow: 'none',
  '&:hover': {
    cursor: 'pointer',
  },
});

const buttonIconContainerStyles = css({
  marginLeft: '4px',
});

const iconDarkThemeStyles = css({
  color: palette.gray.base,
});

const iconLightThemeStyles = css({
  color: palette.gray.dark1,
});

const CreateIndexOptionsAccordion = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [open, setOpen] = useState(false);
  const darkMode = useDarkMode();

  const onOpenChange = () => {
    setOpen(!open);
  };

  return (
    <>
      <button
        className={cx(
          darkMode ? buttonDarkThemeStyles : buttonLightThemeStyles,
          buttonStyles
        )}
        type="button"
        aria-expanded={open ? 'true' : 'false'}
        onClick={onOpenChange}
      >
        <Body baseFontSize={16} weight="medium">
          Options
        </Body>
        <Icon
          className={
            (cx(darkMode ? iconDarkThemeStyles : iconLightThemeStyles),
            buttonIconContainerStyles)
          }
          glyph={open ? 'ChevronDown' : 'ChevronRight'}
        />
      </button>

      {open && <>{children}</>}
    </>
  );
};

export default CreateIndexOptionsAccordion;
