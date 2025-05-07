import {
  Body,
  css,
  Icon,
  palette,
  useDarkMode,
} from '@mongodb-js/compass-components';
import React, { useState } from 'react';

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

const iconStyles = css({
  marginLeft: '4px',
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
        className={buttonStyles}
        type="button"
        aria-expanded={open ? 'true' : 'false'}
        onClick={onOpenChange}
      >
        <Body baseFontSize={16} weight="medium">
          Options
        </Body>
        <Icon
          color={darkMode ? palette.gray.base : palette.gray.dark1}
          className={iconStyles}
          glyph={open ? 'ChevronDown' : 'ChevronRight'}
          data-testid="create-index-options-accordion-icon"
        />
      </button>

      {open && <>{children}</>}
    </>
  );
};

export default CreateIndexOptionsAccordion;
