import React from 'react';

import { isComponentType, keyMap as _keyMap } from '@leafygreen-ui/lib';

import { OptionObject } from '../Combobox.types';

import { getNameAndValue } from './getNameAndValue';

/**
 *
 * Flattens multiple nested ComboboxOptions into a 1D array
 *
 * @param _children
 * @returns `Array<OptionObject>`
 * @internal
 */
export const flattenChildren = (
  _children: React.ReactNode
): Array<OptionObject> => {
  // TS doesn't like .reduce
  // @ts-expect-error
  return React.Children.toArray(_children).reduce(
    // @ts-expect-error
    (
      acc: Array<OptionObject>,
      child: React.ReactNode
    ): Array<OptionObject> | undefined => {
      if (isComponentType(child, 'ComboboxOption')) {
        const { value, displayName } = getNameAndValue(child.props);
        const { glyph, disabled, description } = child.props;

        return [
          ...acc,
          {
            value,
            displayName,
            isDisabled: !!disabled,
            hasGlyph: !!glyph,
            description,
          },
        ];
      } else if (isComponentType(child, 'ComboboxGroup')) {
        const { children } = child.props;

        if (children) {
          return [...acc, ...flattenChildren(children)];
        }
      }
    },
    [] as Array<OptionObject>
  );
};
