import React from 'react';
import {
  configure,
  queryAllByAttribute,
  queryAllByTestId,
  queryByAttribute,
  queryByText,
  render,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import chalk from 'chalk';
import isArray from 'lodash/isArray';
import isNull from 'lodash/isNull';

import LeafyGreenProvider from '@leafygreen-ui/leafygreen-provider';

import {
  BaseComboboxProps,
  ComboboxMultiselectProps,
  OptionObject,
} from './Combobox.types';
import { Combobox, ComboboxGroup, ComboboxOption } from '.';

export interface NestedObject {
  label: string;
  children: Array<string | OptionObject>;
}

export type Select = 'single' | 'multiple';
type renderComboboxProps = {
  options?: Array<string | OptionObject | NestedObject>;
} & BaseComboboxProps &
  ComboboxMultiselectProps<boolean>;

export const defaultOptions: Array<OptionObject> = [
  {
    value: 'apple',
    displayName: 'Apple',
    isDisabled: false,
  },
  {
    value: 'banana',
    displayName: 'Banana',
    isDisabled: false,
  },
  {
    value: 'carrot',
    displayName: 'Carrot',
    isDisabled: false,
  },
];

export const groupedOptions: Array<NestedObject> = [
  {
    label: 'Fruit',
    children: [
      {
        value: 'apple',
        displayName: 'Apple',
        isDisabled: false,
      },
      {
        value: 'banana',
        displayName: 'Banana',
        isDisabled: false,
      },
    ],
  },
  {
    label: 'Vegetables',
    children: [
      {
        value: 'carrot',
        displayName: 'Carrot',
        isDisabled: false,
      },
      {
        value: 'eggplant',
        displayName: 'Eggplant',
        isDisabled: false,
      },
    ],
  },
];

/**
 * @param props Combobox props
 * @returns Combobox JSX
 */
export const getComboboxJSX = (props?: renderComboboxProps) => {
  const isNested = (object: any): object is NestedObject =>
    object.label && object.children;

  const renderOption = (option: NestedObject | OptionObject | string) => {
    if (isNested(option)) {
      return (
        <ComboboxGroup key={option.label} label={option.label}>
          {option.children.map(renderOption)}
        </ComboboxGroup>
      );
    } else {
      const value = typeof option === 'string' ? option : option.value;
      const displayName =
        typeof option === 'string' ? undefined : option.displayName;

      const isDisabled = typeof option === 'string' ? false : option.isDisabled;

      return (
        <ComboboxOption
          key={value}
          value={value}
          displayName={displayName}
          disabled={isDisabled}
        />
      );
    }
  };

  const label = props?.label ?? 'Some label';
  const options = props?.options ?? defaultOptions;
  return (
    <LeafyGreenProvider>
      <Combobox
        data-testid="combobox-container"
        label={label}
        multiselect={props?.multiselect ?? false}
        {...props}
      >
        {options.map(renderOption)}
      </Combobox>
    </LeafyGreenProvider>
  );
};

/**
 * Renders a combobox
 * @param select `'single' | 'multiple'`
 * @param props `renderComboboxProps`
 * @returns Object of combobox elements & utility functions
 */
export function renderCombobox<T extends Select>(
  select: T = 'single' as T,
  props?: renderComboboxProps,
) {
  const multiselect = select === 'multiple';
  const options = props?.options || defaultOptions;
  props = { options, multiselect, ...props };

  const renderResult = render(getComboboxJSX(props));
  const containerEl = renderResult.getByTestId('combobox-container');
  const labelEl = containerEl.getElementsByTagName('label')[0];
  const comboboxEl = renderResult.getByRole('combobox');
  const inputEl = containerEl.getElementsByTagName('input')[0];
  const clearButtonEl = renderResult.queryByLabelText('Clear selection');

  /**
   * Since menu elements won't exist until component is interacted with,
   * call this after opening the menu.
   * @returns Object of menu elements
   */
  function getMenuElements() {
    const menuContainerEl = renderResult.queryByRole('listbox');
    const popoverEl = menuContainerEl?.firstChild;
    const menuEl = menuContainerEl?.getElementsByTagName('ul')[0];
    const optionElements = menuContainerEl?.getElementsByTagName('li');
    const selectedElements = menuEl
      ? select === 'single'
        ? queryByAttribute('aria-selected', menuEl, 'true')
        : queryAllByAttribute('aria-selected', menuEl, 'true')
      : undefined;

    return {
      menuContainerEl,
      popoverEl,
      menuEl,
      optionElements,
      selectedElements: selectedElements as
        | (T extends 'single' ? HTMLElement : Array<HTMLElement>)
        | null,
    };
  }

  /**
   * Opens the menu by simulating a click on the combobox.
   * @returns Object of menu elements
   */
  const openMenu = () => {
    userEvent.click(inputEl);
    return getMenuElements();
  };

  /**
   * Rerenders the combobox with new props
   * @param newProps
   * @returns
   */
  const rerenderCombobox = (newProps: renderComboboxProps) =>
    renderResult.rerender(getComboboxJSX({ ...props, ...newProps }));

  /**
   * @returns all chip elements
   */
  function queryAllChips(): Array<HTMLElement> {
    return queryAllByTestId(containerEl, 'lg-combobox-chip');
  }

  /**
   * Get the chip(s) with the provided display name(s)
   * @param names: `string` | `Array<string>`
   * @returns A single HTMLElement or array of HTMLElements
   */
  function queryChipsByName(names: string): HTMLElement | null;
  function queryChipsByName(names: Array<string>): Array<HTMLElement> | null;
  function queryChipsByName(
    names: string | Array<string>,
  ): HTMLElement | Array<HTMLElement> | null {
    if (typeof names === 'string') {
      const span = queryByText(comboboxEl, names);
      return span ? span.parentElement : null;
    } else {
      const spans = names
        .map((name: any) => queryByText(comboboxEl, name))
        .filter(span => !isNull(span))
        .map(span => span?.parentElement);
      return spans.length > 0 ? (spans as Array<HTMLElement>) : null;
    }
  }

  function queryChipsByIndex(index: number): HTMLElement | null;
  function queryChipsByIndex(index: 'first' | 'last'): HTMLElement | null;
  function queryChipsByIndex(index: Array<number>): Array<HTMLElement> | null;
  function queryChipsByIndex(
    index: 'first' | 'last' | number | Array<number>,
  ): HTMLElement | Array<HTMLElement> | null {
    const allChips = queryAllChips();

    if (allChips.length > 0) {
      if (typeof index === 'number' && index <= allChips.length) {
        return allChips[index];
      } else if (typeof index === 'string') {
        return index === 'first' ? allChips[0] : allChips[allChips.length - 1];
      } else if (isArray(index) && index.every(i => i <= allChips.length)) {
        return index.map(i => allChips[i]);
      }
    }

    return null;
  }

  return {
    ...renderResult,
    rerenderCombobox,
    queryChipsByName,
    queryChipsByIndex,
    queryAllChips,
    getMenuElements,
    openMenu,
    containerEl,
    labelEl,
    comboboxEl,
    inputEl,
    clearButtonEl,
  };
}

/**
 * Conditionally runs a test
 * @param condition
 * @returns `test`
 */
export const testif = (condition: boolean) => (condition ? test : test.skip);

configure({
  getElementError: message => new Error(message ?? ''),
});

expect.extend({
  toContainFocus(received: HTMLElement) {
    return received.contains(document.activeElement)
      ? {
          pass: true,
          message: () =>
            `\t Expected element not to contain focus: \n\t\t ${chalk.red(
              received.outerHTML,
            )} \n\t Element with focus: \n\t\t ${chalk.blue(
              // @ts-ignore
              document.activeElement?.outerHTML,
            )}`,
        }
      : {
          pass: false,
          message: () =>
            `\t Expected element to contain focus: \n\t\t ${chalk.green(
              received.outerHTML,
            )} \n\t Element with focus: \n\t\t ${chalk.red(
              // @ts-ignore

              document.activeElement?.outerHTML,
            )}`,
        };
  },
});

declare global {
  namespace jest {
    interface Matchers<R> {
      toContainFocus(): R;
    }
  }
}
