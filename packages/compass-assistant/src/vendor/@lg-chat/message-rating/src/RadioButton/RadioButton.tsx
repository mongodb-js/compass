import React, { ForwardedRef, forwardRef } from 'react';

import { useDarkMode } from '@mongodb-js/compass-components';

import { getContainerStyles, labelStyles } from './RadioButton.styles';
import { RadioButtonProps } from './RadioButton.types';

export const RadioButton = forwardRef(
  (
    {
      checked,
      children,
      className,
      darkMode: darkModeProp,
      id,
      name,
      ...rest
    }: RadioButtonProps,
    ref: ForwardedRef<HTMLDivElement>
  ) => {
    const { theme } = useDarkMode(darkModeProp);
    return (
      <div
        className={getContainerStyles({
          checked,
          className,
          theme,
        })}
        ref={ref}
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
      >
        <input
          id={id}
          type="radio"
          name={name}
          defaultChecked={checked}
          aria-checked={checked}
          hidden
          {...rest}
        />
        <label htmlFor={id} className={labelStyles}>
          {children}
        </label>
      </div>
    );
  }
);

RadioButton.displayName = 'RadioButton';
