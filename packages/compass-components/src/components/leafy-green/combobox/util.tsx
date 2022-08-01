import { isComponentType, keyMap as _keyMap } from '@leafygreen-ui/lib';
import { kebabCase } from 'lodash';
import React from 'react';
import type { ComboboxOptionProps } from './combobox-types';

// TODO - remove this when lib/keyMap supports Backspace & Delete
export const keyMap = {
  ..._keyMap,
  Backspace: 8,
  Delete: 46,
} as const;

const escapeRegExp = (input: string) => {
  return input.replace(/[-[/\]{}()*+?.,\\^$|#\s]/g, '\\$&');
};

/**
 *
 * Wraps the first instance of `wrap` found in `str` within the provided `element`.
 *
 * E.g. `wrapJSX('Apple', 'ap', 'em') => <><em>Ap</em>ple</>`
 *
 * @param str
 * @param wrap
 * @param element
 * @returns `JSX.Element`
 */
export const wrapJSX = (
  str: string,
  wrap?: string,
  element?: string
): JSX.Element => {
  if (wrap && element) {
    const regex = new RegExp(escapeRegExp(wrap), 'gi');
    const startIndex = str.search(regex);
    const endIndex = startIndex + wrap.length;
    const nameArr = str.split('');
    const start = nameArr.slice(0, startIndex).join('');
    const end = nameArr.slice(endIndex).join('');
    const match = nameArr.slice(startIndex, endIndex).join('');
    const matchEl = React.createElement(element, null, match);
    return (
      <>
        {start}
        {matchEl}
        {end}
      </>
    );
  }

  return <>{str}</>;
};

/**
 *
 * Returns an object with properties `value` & `displayName`
 * based on the props provided
 *
 * @property value: string
 * @property displayName: string
 */
export const getNameAndValue = ({
  value: valProp,
  displayName: nameProp,
}: ComboboxOptionProps): {
  value: string;
  displayName: string;
} => {
  return {
    value: valProp ?? kebabCase(nameProp),
    displayName: nameProp ?? valProp ?? '', // TODO consider adding a prop to customize displayName => startCase(valProp),
  };
};

export interface OptionObject {
  value: string;
  displayName: string;
  hasGlyph?: boolean;
}

/**
 *
 * Flattens multiple nested ComboboxOptions into a 1D array
 *
 * @param _children
 * @returns `Array<OptionObject>`
 */
export const flattenChildren = (
  _children: React.ReactNode
): Array<OptionObject> => {
  // TS doesn't like .reduce
  // @ts-expect-error unknown case
  return React.Children.toArray(_children).reduce(
    // @ts-expect-error unknown case
    (
      acc: Array<OptionObject>,
      child: React.ReactNode
    ): Array<OptionObject> | undefined => {
      if (isComponentType(child, 'ComboboxOption')) {
        const { value, displayName } = getNameAndValue(child.props);
        const { glyph } = child.props;

        return [
          ...acc,
          {
            value,
            displayName,
            hasGlyph: !!glyph,
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
