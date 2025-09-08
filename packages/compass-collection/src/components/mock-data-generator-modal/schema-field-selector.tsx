import React from 'react';
import {
  css,
  cx,
  spacing,
  palette,
  useDarkMode,
  Body,
} from '@mongodb-js/compass-components';

const fieldSelectorStyles = css({
  width: '40%',
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[100],
});

const buttonStyles = css({
  borderRadius: spacing[100],
  cursor: 'pointer',
  marginBottom: spacing[100],
  background: 'none',
  border: 'none',
  width: '100%',
  padding: spacing[200],
  textAlign: 'left',
  fontWeight: 500,
});

const hoverStylesLight = css({
  '&:hover,&:focus': {
    backgroundColor: palette.green.light2,
    color: palette.gray.dark3,
  },
});

const activeStylesLight = css({
  backgroundColor: palette.green.light3,
  color: palette.gray.dark3,
  '&:active,&:focus': {
    backgroundColor: palette.green.light3,
    color: palette.gray.dark3,
  },
});

const hoverStylesDark = css({
  '&:hover,&:focus': {
    backgroundColor: palette.gray.dark3,
    color: palette.white,
  },
});

const activeStylesDark = css({
  backgroundColor: palette.gray.dark2,
  color: palette.white,
  '&:active,&:focus': {
    backgroundColor: palette.gray.dark2,
    color: palette.white,
  },
});

type SidebarProps = {
  activeField: string;
  onFieldSelect: (field: string) => void;
  fields: Array<string>;
};

const FieldSelector: React.FunctionComponent<SidebarProps> = ({
  activeField,
  fields,
  onFieldSelect,
}) => {
  const darkMode = useDarkMode();

  return (
    <div
      data-testid="schema-field-selector"
      role="tablist"
      aria-label="Schema Field Selector"
      className={fieldSelectorStyles}
    >
      <Body>Document fields</Body>

      {fields.map((field) => (
        <button
          type="button"
          key={field}
          role="tab"
          aria-controls={`${field}-section`}
          aria-selected={activeField === field}
          className={cx(buttonStyles, {
            [darkMode ? hoverStylesDark : hoverStylesLight]:
              field !== activeField,
            [darkMode ? activeStylesDark : activeStylesLight]:
              field === activeField,
          })}
          id={`${field}-tab`}
          data-testid={`schema-field-selector-${field}-field`}
          onClick={() => onFieldSelect(field)}
        >
          {field}
        </button>
      ))}
    </div>
  );
};

export default FieldSelector;
