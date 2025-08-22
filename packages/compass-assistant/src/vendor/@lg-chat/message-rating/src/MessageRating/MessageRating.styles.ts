import { css, cx } from '@mongodb-js/compass-components';
import { palette } from '@mongodb-js/compass-components';
import { spacing } from '@mongodb-js/compass-components';

const baseContainerStyles = css`
  display: flex;
  align-items: center;
  gap: ${spacing[200]}px;
`;

export const getContainerStyles = (className?: string) =>
  cx(baseContainerStyles, className);

export const buttonContainerStyles = css`
  display: flex;
  align-items: center;
  gap: ${spacing[100]}px;
`;

const getBaseIconFill = (darkMode: boolean) =>
  palette.gray[darkMode ? 'light2' : 'dark1'];

const getSelectedIconFill = (darkMode: boolean) =>
  darkMode ? palette.black : palette.gray.light3;

export const getIconFill = ({
  darkMode,
  isSelected,
}: {
  darkMode: boolean;
  isSelected: boolean;
}) => (isSelected ? getSelectedIconFill(darkMode) : getBaseIconFill(darkMode));

const baseActiveStyles = css`
  &::before {
    background-color: initial;
  }
`;

const getActiveStyles = (isActive: boolean) =>
  cx({
    [baseActiveStyles]: isActive,
  });

const baseHiddenStyles = css`
  display: none;
`;

export const getHiddenStyles = (isHidden: boolean) =>
  cx({
    [baseHiddenStyles]: isHidden,
  });

export const getIconButtonStyles = ({
  isActive,
  isHidden,
}: {
  isActive: boolean;
  isHidden: boolean;
}) => cx(getActiveStyles(isActive), getHiddenStyles(isHidden));
