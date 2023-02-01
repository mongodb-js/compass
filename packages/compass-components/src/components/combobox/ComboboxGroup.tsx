import React, { useContext } from 'react';
import PropTypes from 'prop-types';

import { css, cx } from '@leafygreen-ui/emotion';
import { useIdAllocator } from '@leafygreen-ui/hooks';
import { Theme } from '@leafygreen-ui/lib';
import { palette } from '@leafygreen-ui/palette';

import { ComboboxGroupProps } from './Combobox.types';
import { ComboboxContext } from './ComboboxContext';

const comboboxGroupStyle: Record<Theme, string> = {
  [Theme.Light]: css`
    padding-top: 8px;
  `,
  [Theme.Dark]: css`
    padding-top: 8px;
  `,
};

const comboboxGroupLabel = css`
  cursor: default;
  width: 100%;
  padding: 0 12px 2px;
  outline: none;
  overflow-wrap: anywhere;
  font-size: 12px;
  line-height: 16px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.4px;
`;

const comboboxGroupLabelThemeStyle: Record<Theme, string> = {
  [Theme.Light]: css`
    color: ${palette.gray.dark1};
  `,
  [Theme.Dark]: css`
    color: ${palette.gray.light1};
  `,
};

export function InternalComboboxGroup({
  label,
  className,
  children,
}: ComboboxGroupProps): JSX.Element {
  const { theme } = useContext(ComboboxContext);

  const groupId = useIdAllocator({ prefix: 'combobox-group' });
  const childCount = React.Children.count(children);

  return childCount > 0 ? (
    <div className={cx(comboboxGroupStyle[theme], className)}>
      <div
        className={cx(comboboxGroupLabel, comboboxGroupLabelThemeStyle[theme])}
        id={groupId}
      >
        {label}
      </div>
      <div role="group" aria-labelledby={groupId}>
        {children}
      </div>
    </div>
  ) : (
    <></>
  );
}

ComboboxGroup.displayName = 'ComboboxGroup';

ComboboxGroup.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
};

export default function ComboboxGroup(_: ComboboxGroupProps): JSX.Element {
  throw Error('`ComboboxGroup` must be a child of a `Combobox` instance');
}
