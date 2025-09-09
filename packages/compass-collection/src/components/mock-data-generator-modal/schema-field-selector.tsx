import React from 'react';
import {
  css,
  cx,
  spacing,
  palette,
  useDarkMode,
  Body,
} from '@mongodb-js/compass-components';

const fieldsContainerStyles = css({
  width: '40%',
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[100],
});

const fieldSelectorStyles = css({
  maxHeight: '300px',
  overflow: 'auto',
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

const activeStylesLight = css({
  color: palette.green.dark2,
  backgroundColor: palette.green.light3,
  fontWeight: 600,

  '&:active,&:focus': {
    backgroundColor: palette.green.light3,
  },
});

const activeStylesDark = css({
  color: palette.white,
  '&:active,&:focus': {
    backgroundColor: palette.gray.dark3,
    color: palette.white,
  },
});

const hoverStylesLight = css({
  '&:hover,&:focus': {
    backgroundColor: palette.gray.light2,
    color: palette.black,
  },
});

const hoverStylesDark = css({
  '&:hover,&:focus': {
    backgroundColor: palette.gray.dark3,
    color: palette.gray.light2,
  },
});

const labelStyles = css({
  color: palette.gray.dark1,
  fontWeight: 600,
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
      className={fieldsContainerStyles}
    >
      <Body className={labelStyles}>Document Fields</Body>
      <div className={fieldSelectorStyles}>
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
    </div>
  );
};

export default FieldSelector;
