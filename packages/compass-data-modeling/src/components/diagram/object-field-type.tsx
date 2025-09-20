import React, { useCallback } from 'react';
import {
  css,
  cx,
  focusRing,
  palette,
  spacing,
  transitionDuration,
  transparentize,
  useDarkMode,
} from '@mongodb-js/compass-components';

import PlusWithSquare from '../icons/plus-with-square';

const objectTypeContainerStyles = css({
  display: 'flex',
  justifyContent: 'flex-end',
  alignItems: 'center',
});

const iconButtonHoverStyles = css({
  color: palette.gray.dark1,

  '&::before': {
    content: '""',
    transition: `${transitionDuration.default}ms all ease-in-out`,
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: '100%',
    transform: 'scale(0.8)',
  },

  [`&:active:before,
  &:hover:before,
  &:focus:before,
  &[data-hover='true']:before,
  &[data-focus='true']:before`]: {
    transform: 'scale(1)',
  },

  [`&:active,
    &:hover,
    &[data-hover='true'],
    &:focus-visible,
    &[data-focus='true']`]: {
    color: palette.black,

    '&::before': {
      backgroundColor: transparentize(0.9, palette.gray.dark2),
    },
  },
});

const iconButtonHoverDarkModeStyles = css({
  color: palette.gray.light1,

  [`&:active,
    &:hover,
    &[data-hover='true'],
    &:focus-visible,
    &[data-focus='true']`]: {
    color: palette.gray.light3,

    '&::before': {
      backgroundColor: transparentize(0.9, palette.gray.light2),
    },
  },
});

const addNestedFieldStyles = css(iconButtonHoverStyles, focusRing, {
  background: 'none',
  border: 'none',
  padding: spacing[100],
  margin: 0,
  marginLeft: spacing[100],
  cursor: 'pointer',
  color: 'inherit',
  display: 'flex',
});

type ObjectFieldTypeProps = {
  onClickAddNestedField: (event: React.MouseEvent<HTMLButtonElement>) => void;
  ['data-testid']: string;
};

const ObjectFieldType: React.FunctionComponent<ObjectFieldTypeProps> = ({
  'data-testid': dataTestId,
  onClickAddNestedField: _onClickAddNestedField,
}) => {
  const darkMode = useDarkMode();

  const onClickAddNestedField = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      // Don't click on the field element.
      event.stopPropagation();
      _onClickAddNestedField(event);
    },
    [_onClickAddNestedField]
  );

  return (
    <div className={objectTypeContainerStyles}>
      {'{}'}
      <button
        className={cx(
          addNestedFieldStyles,
          darkMode && iconButtonHoverDarkModeStyles
        )}
        data-testid={dataTestId}
        onClick={onClickAddNestedField}
        aria-label="Add new field"
        title="Add Field"
      >
        <PlusWithSquare />
      </button>
    </div>
  );
};

export { ObjectFieldType };
