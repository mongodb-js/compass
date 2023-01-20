/* eslint-disable jest/no-standalone-expect */
/* eslint jest/expect-expect: ["error", { "assertFunctionNames": ["expect", "expectSelection"] }] */
import React from 'react';
import {
  act,
  fireEvent,
  queryByText,
  render,
  waitFor,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import flatten from 'lodash/flatten';
import isUndefined from 'lodash/isUndefined';
import startCase from 'lodash/startCase';

import Button from '@leafygreen-ui/button';
import { keyMap } from '@leafygreen-ui/lib';

import { OptionObject } from './Combobox.types';
import {
  defaultOptions,
  getComboboxJSX,
  groupedOptions,
  NestedObject,
  renderCombobox,
  Select,
  testif,
} from './ComboboxTestUtils';

/**
 * Tests
 */
describe('packages/combobox', () => {
  describe('A11y', () => {
    test('does not have basic accessibility violations', async () => {
      const { container, openMenu } = renderCombobox();
      openMenu();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  // DarkMode prop
  test.todo('Darkmode prop applies the correct styles');

  // size prop
  test.todo('Size prop applies the correct styles');

  /**
   * Overflow prop
   */
  test.todo('expand-y');
  test.todo('scroll-x');

  const tests = [['single'], ['multiple']] as Array<Array<Select>>;

  describe.each(tests)('%s select', select => {
    /** Run tests for single select only */
    const testSingleSelect = (name: string, fn?: jest.ProvidesCallback) =>
      isUndefined(fn) ? test.todo(name) : testif(select === 'single')(name, fn);

    /** Run tests for multi-select only */
    const testMultiSelect = (name: string, fn?: jest.ProvidesCallback) =>
      isUndefined(fn)
        ? test.todo(name)
        : testif(select === 'multiple')(name, fn);

    describe('Basic rendering', () => {
      // Label prop
      test('Label is rendered', () => {
        const { labelEl } = renderCombobox(select, { label: 'Some label' });
        expect(labelEl).toBeInTheDocument();
      });

      // Description prop
      test('Description is rendered', () => {
        const description = 'Lorem ipsum';
        const { queryByText } = renderCombobox(select, { description });
        const descriptionEl = queryByText(description);
        expect(descriptionEl).not.toBeNull();
        expect(descriptionEl).toBeInTheDocument();
      });

      // Placeholder prop
      test('Placeholder is rendered', () => {
        const placeholder = 'Placeholder text';
        const { inputEl } = renderCombobox(select, { placeholder });
        expect(inputEl.placeholder).toEqual(placeholder);
      });

      // errorMessage & state prop
      test('Error message is rendered when state == `error`', () => {
        const errorMessage = 'Some error message';
        const { queryByText } = renderCombobox(select, {
          errorMessage,
          state: 'error',
        });
        const errorEl = queryByText(errorMessage);
        expect(errorEl).not.toBeNull();
        expect(errorEl).toBeInTheDocument();
      });

      test('Error message is not rendered when state !== `error`', () => {
        const errorMessage = 'Some error message';
        const { queryByText } = renderCombobox(select, {
          errorMessage,
        });
        const errorEl = queryByText(errorMessage);
        expect(errorEl).not.toBeInTheDocument();
      });

      // Clear button
      test('Clear button is rendered when selection is set', () => {
        const initialValue = select === 'multiple' ? ['apple'] : 'apple';
        const { clearButtonEl } = renderCombobox(select, {
          initialValue,
        });
        expect(clearButtonEl).toBeInTheDocument();
      });

      test('Clear button is not rendered when there is no selection', () => {
        const { clearButtonEl } = renderCombobox(select);
        expect(clearButtonEl).not.toBeInTheDocument();
      });

      test('Clear button is not rendered when clearable == `false`', () => {
        const initialValue = select === 'multiple' ? ['apple'] : 'apple';
        const { clearButtonEl } = renderCombobox(select, {
          initialValue,
          clearable: false,
        });
        expect(clearButtonEl).not.toBeInTheDocument();
      });
    });

    /**
     * Option Rendering
     */
    describe('Option rendering', () => {
      test('All options render in the menu', () => {
        const { openMenu } = renderCombobox(select);
        const { optionElements } = openMenu();
        expect(optionElements).toHaveLength(defaultOptions.length);
      });

      test('Options render with provided displayName', async () => {
        const { openMenu } = renderCombobox(select);
        const { optionElements } = openMenu();
        // Note on `foo!` operator https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-0.html#non-null-assertion-operator
        Array.from(optionElements!).forEach((optionEl, index) => {
          expect(optionEl).toHaveTextContent(defaultOptions[index].displayName);
        });
      });

      test('Option is rendered with provided value when no displayName is provided', () => {
        const options = [{ value: 'abc-def' }];
        /// @ts-expect-error `options` will not match the expected type
        const { openMenu } = renderCombobox(select, { options });
        const { optionElements } = openMenu();
        const [optionEl] = Array.from(optionElements!);
        expect(optionEl).toHaveTextContent('abc-def');
      });

      test('Options with long names are rendered with the full text', () => {
        const displayName = `Donec id elit non mi porta gravida at eget metus. Aenean lacinia bibendum nulla sed consectetur.`;
        const options: Array<OptionObject> = [
          {
            value: 'paragraph',
            displayName,
            isDisabled: false,
          },
        ];

        const { openMenu } = renderCombobox(select, { options });
        const { optionElements } = openMenu();
        const [optionEl] = Array.from(optionElements!);
        expect(optionEl).toHaveTextContent(displayName);
      });

      test('Disabled options are still rendered in the menu', () => {
        const options: Array<OptionObject> = [
          ...defaultOptions,
          {
            value: 'disabled',
            displayName: 'Disabled',
            isDisabled: true,
          },
        ];
        const { openMenu } = renderCombobox(select, { options });
        const { optionElements } = openMenu();
        expect(optionElements).toHaveLength(defaultOptions.length + 1);
      });

      test('Disabled option is not selectable with the mouse', () => {
        const options: Array<OptionObject> = [
          {
            value: 'disabled',
            displayName: 'Disabled',
            isDisabled: true,
          },
          ...defaultOptions,
        ];
        const initialValue = select === 'multiple' ? ['apple'] : 'apple';
        const { openMenu, inputEl, queryChipsByName } = renderCombobox(select, {
          options,
          initialValue,
        });
        const { optionElements } = openMenu();
        const disabledOption = optionElements?.[0];
        userEvent.click(disabledOption as HTMLLIElement);
        if (select === 'multiple') {
          expect(queryChipsByName('Apple')).toBeInTheDocument();
          expect(queryChipsByName('Disabled')).not.toBeInTheDocument();
        } else {
          expect(inputEl).toHaveValue('Apple');
        }
      });

      test('Disabled option is not selectable with the keyboard', () => {
        const options: Array<OptionObject> = [
          {
            value: 'disabled',
            displayName: 'Disabled',
            isDisabled: true,
          },
          ...defaultOptions,
        ];
        const initialValue = select === 'multiple' ? ['apple'] : 'apple';
        const { openMenu, inputEl, queryChipsByName } = renderCombobox(select, {
          options,
          initialValue,
        });
        const { optionElements } = openMenu();
        const disabledOption = optionElements![0];
        userEvent.type(disabledOption, `{enter}`);
        if (select === 'multiple') {
          expect(queryChipsByName('Apple')).toBeInTheDocument();
          expect(queryChipsByName('Disabled')).not.toBeInTheDocument();
        } else {
          expect(inputEl).toHaveValue('Apple');
        }
      });

      // Grouped Options
      describe('Grouped Options', () => {
        test('Grouped items should render', () => {
          const { openMenu } = renderCombobox(select, {
            options: groupedOptions,
          });
          const { menuContainerEl } = openMenu();

          flatten(
            groupedOptions.map(({ children }: NestedObject) => children),
          ).forEach((option: OptionObject | string) => {
            const displayName =
              typeof option === 'string' ? option : option.displayName;
            const optionEl = queryByText(menuContainerEl!, displayName);
            expect(optionEl).toBeInTheDocument();
          });
        });

        test('Grouped item labels should render', () => {
          const { openMenu } = renderCombobox(select, {
            options: groupedOptions,
          });
          const { menuContainerEl } = openMenu();

          const [fruitLabel, veggieLabel] = [
            queryByText(menuContainerEl!, 'Fruit'),
            queryByText(menuContainerEl!, 'Vegetables'),
          ];
          expect(fruitLabel).toBeInTheDocument();
          expect(veggieLabel).toBeInTheDocument();
        });
      });
    });

    describe('When disabled', () => {
      // disabled prop
      test('Combobox is not clickable when `disabled`', () => {
        const { comboboxEl } = renderCombobox(select, { disabled: true });
        userEvent.click(comboboxEl);
        expect(document.body).toHaveFocus();
      });

      test('Combobox is not focusable when `disabled`', () => {
        renderCombobox(select, { disabled: true });
        userEvent.type(document.body, '{tab');
        expect(document.body).toHaveFocus();
      });
    });

    /**
     * Initial Value
     */
    describe('#initialValue prop', () => {
      testSingleSelect('Initial value prop renders text input value', () => {
        const initialValue = 'apple';
        const { inputEl } = renderCombobox(select, { initialValue });
        expect(inputEl).toHaveValue('Apple');
      });

      testSingleSelect(
        'Initial value prop renders truncated long text input value',
        () => {
          const displayName = `Donec id elit non mi porta gravida at eget metus. Aenean lacinia bibendum nulla sed consectetur.`;
          const options: Array<OptionObject> = [
            {
              value: 'paragraph',
              displayName,
              isDisabled: false,
            },
            ...defaultOptions,
          ];
          const initialValue = 'paragraph';
          const { inputEl } = renderCombobox(select, { initialValue, options });
          expect(inputEl).toHaveValue(displayName);
          expect(inputEl.scrollWidth).toBeGreaterThanOrEqual(
            inputEl.clientWidth,
          );
        },
      );

      testMultiSelect('Initial value prop renders chips', () => {
        const initialValue = ['apple', 'banana'];
        const { queryChipsByName, queryAllChips } = renderCombobox(select, {
          initialValue,
        });
        waitFor(() => {
          const allChips = queryChipsByName(['Apple', 'Banana']);
          allChips?.forEach(chip => expect(chip).toBeInTheDocument());
          expect(queryAllChips()).toHaveLength(2);
        });
      });

      testSingleSelect(
        'Selected single select option renders with a checkmark icon',
        () => {
          const initialValue = 'apple';
          const { openMenu } = renderCombobox('single', { initialValue });
          const { selectedElements } = openMenu();
          expect(selectedElements?.querySelector('svg')).not.toBeNull();
        },
      );

      testMultiSelect(
        'Each multiple select option renders with a checkbox input',
        () => {
          const initialValue = ['apple', 'banana'];
          const { openMenu } = renderCombobox('multiple', { initialValue });
          const { selectedElements } = openMenu();
          expect(
            selectedElements?.every(element => element?.querySelector('input')),
          ).toBeTruthy();
        },
      );
    });

    /**
     * Input element
     */
    describe('Input interaction', () => {
      test('Typing any character updates the input', () => {
        const { inputEl } = renderCombobox(select);
        userEvent.type(inputEl, 'zy');
        expect(inputEl).toHaveValue('zy');
      });

      test('Initial value prop renders truncated long text input value', () => {
        const displayName = `Donec id elit non mi porta gravida at eget metus. Aenean lacinia bibendum nulla sed consectetur.`;
        const { inputEl } = renderCombobox(select);
        userEvent.type(inputEl, displayName);
        expect(inputEl).toHaveValue(displayName);
        expect(inputEl.scrollWidth).toBeGreaterThanOrEqual(inputEl.clientWidth);
      });
    });

    /**
     * Controlled
     * (i.e. `value` prop)
     */
    describe('When value is controlled', () => {
      test('Typing any character updates the input', () => {
        const value = select === 'multiple' ? [] : '';
        const { inputEl } = renderCombobox(select, {
          value,
        });
        expect(inputEl).toHaveValue('');
        userEvent.type(inputEl, 'z');
        expect(inputEl).toHaveValue('z');
      });

      testSingleSelect('Text input renders with value update', () => {
        let value = 'apple';
        const { inputEl, rerenderCombobox } = renderCombobox(select, {
          value,
        });
        expect(inputEl).toHaveValue('Apple');
        value = 'banana';
        rerenderCombobox({ value });
        expect(inputEl).toHaveValue('Banana');
      });

      testSingleSelect('Invalid option passed as value is not selected', () => {
        const value = 'jellybean';
        const { inputEl } = renderCombobox(select, { value });
        expect(inputEl).toHaveValue('');
      });

      testMultiSelect('Updating `value` updates the chips', () => {
        let value = ['apple', 'banana'];
        const { queryChipsByName, queryAllChips, rerenderCombobox } =
          renderCombobox(select, {
            value,
          });
        waitFor(() => {
          const allChips = queryChipsByName(['Apple', 'Banana']);
          allChips?.forEach(chip => expect(chip).toBeInTheDocument());
          expect(queryAllChips()).toHaveLength(2);
          value = ['banana', 'carrot'];
          rerenderCombobox({ value });
          waitFor(() => {
            const allChips = queryChipsByName(['Carrot', 'Banana']);
            allChips?.forEach(chip => expect(chip).toBeInTheDocument());
            expect(queryAllChips()).toHaveLength(2);
          });
        });
      });

      testMultiSelect('Invalid options are not selected', () => {
        const value = ['apple', 'jellybean'];
        const { queryChipsByName, queryAllChips } = renderCombobox(select, {
          value,
        });
        waitFor(() => {
          const allChips = queryChipsByName(['Apple']);
          allChips?.forEach(chip => expect(chip).toBeInTheDocument());
          expect(queryChipsByName('Jellybean')).not.toBeInTheDocument();
          expect(queryAllChips()).toHaveLength(1);
        });
      });
    });

    /**
     * Mouse interaction
     */
    describe('Mouse interaction', () => {
      test('Menu is not initially opened', () => {
        const { getMenuElements } = renderCombobox(select);
        const { menuContainerEl } = getMenuElements();
        expect(menuContainerEl).not.toBeInTheDocument();
      });

      test('Clicking the combobox sets focus to the input', () => {
        const { comboboxEl, inputEl } = renderCombobox(select);
        userEvent.click(comboboxEl);
        expect(inputEl).toHaveFocus();
      });

      test('Menu appears when box is clicked', () => {
        const { comboboxEl, getMenuElements } = renderCombobox(select);
        userEvent.click(comboboxEl);
        const { menuContainerEl } = getMenuElements();
        expect(menuContainerEl).not.toBeNull();
        expect(menuContainerEl).toBeInTheDocument();
      });

      test('Clicking an option sets selection', () => {
        const { openMenu, queryChipsByName, inputEl } = renderCombobox(select);
        const { optionElements } = openMenu();
        expect(optionElements).not.toBeUndefined();
        userEvent.click((optionElements as HTMLCollectionOf<HTMLLIElement>)[2]);
        if (select === 'multiple') {
          expect(queryChipsByName('Carrot')).toBeInTheDocument();
        } else {
          expect(inputEl).toHaveValue('Carrot');
        }
      });

      testSingleSelect('Clicking selected option closes menu', async () => {
        const { openMenu } = renderCombobox(select, {
          initialValue: 'apple',
        });
        const { optionElements, menuContainerEl } = openMenu();
        expect(optionElements).not.toBeUndefined();
        userEvent.click((optionElements as HTMLCollectionOf<HTMLLIElement>)[0]);
        await waitForElementToBeRemoved(menuContainerEl);
        expect(menuContainerEl).not.toBeInTheDocument();
      });

      testMultiSelect(
        'Clicking selected option toggles selection & does NOT close menu',
        async () => {
          const { openMenu, queryChipsByName } = renderCombobox(select, {
            initialValue: ['apple'],
          });
          const selectedChip = queryChipsByName('Apple');
          expect(selectedChip).toBeInTheDocument();
          const { optionElements, menuContainerEl } = openMenu();
          expect(optionElements).not.toBeUndefined();

          userEvent.click(
            (optionElements as HTMLCollectionOf<HTMLLIElement>)[0],
          );

          await waitFor(() => {
            expect(selectedChip).not.toBeInTheDocument();
            expect(menuContainerEl).toBeInTheDocument();
          });
        },
      );

      testSingleSelect('Clicking any option closes menu', async () => {
        const { openMenu } = renderCombobox(select);
        const { optionElements, menuContainerEl } = openMenu();
        expect(optionElements).not.toBeUndefined();
        userEvent.click((optionElements as HTMLCollectionOf<HTMLLIElement>)[1]);
        await waitForElementToBeRemoved(menuContainerEl);
        expect(menuContainerEl).not.toBeInTheDocument();
      });

      testMultiSelect(
        'Clicking any option toggles selection & does NOT close menu',
        async () => {
          const { openMenu, queryChipsByName } = renderCombobox(select);
          const { optionElements, menuContainerEl } = openMenu();
          expect(optionElements).not.toBeUndefined();

          userEvent.click(
            (optionElements as HTMLCollectionOf<HTMLLIElement>)[0],
          );

          await waitFor(() => {
            const selectedChip = queryChipsByName('Apple');
            expect(selectedChip).toBeInTheDocument();
            expect(menuContainerEl).toBeInTheDocument();
          });
        },
      );

      testSingleSelect(
        'Input returned to previous valid selection when menu closes',
        () => {
          const initialValue = 'apple';
          const { inputEl } = renderCombobox(select, {
            initialValue,
          });
          userEvent.type(inputEl, '{backspace}{backspace}{esc}');
          expect(inputEl).toHaveValue('Apple');
        },
      );

      testSingleSelect(
        'Clicking after making a selection should re-open the menu',
        async () => {
          const { comboboxEl, inputEl, openMenu, getMenuElements } =
            renderCombobox(select);
          const { optionElements, menuContainerEl } = openMenu();
          const firstOption = optionElements![0];
          userEvent.click(firstOption);
          await waitForElementToBeRemoved(menuContainerEl);
          userEvent.click(comboboxEl);
          waitFor(() => {
            const { menuContainerEl: newMenuContainerEl } = getMenuElements();
            expect(newMenuContainerEl).not.toBeNull();
            expect(newMenuContainerEl).toBeInTheDocument();
            expect(inputEl).toHaveFocus();
          });
        },
      );

      test('Opening the menu when there is a selection should show all options', () => {
        // See also: 'Pressing Down Arrow when there is a selection shows all menu options'
        const initialValue = select === 'multiple' ? ['apple'] : 'apple';
        const { comboboxEl, getMenuElements } = renderCombobox(select, {
          initialValue,
        });
        userEvent.click(comboboxEl);
        const { optionElements } = getMenuElements();
        expect(optionElements).toHaveLength(defaultOptions.length);
      });

      describe('Clickaway', () => {
        test('Menu closes on click-away', async () => {
          const { containerEl, openMenu } = renderCombobox(select);
          const { menuContainerEl } = openMenu();
          userEvent.click(containerEl.parentElement!);
          await waitForElementToBeRemoved(menuContainerEl);
          expect(menuContainerEl).not.toBeInTheDocument();
          expect(containerEl).toContainFocus();
        });

        test("Other click handlers don't fire on click-away", async () => {
          const buttonClickHandler = jest.fn();
          const comboboxJSX = getComboboxJSX({
            multiselect: select === 'multiple',
          });
          const renderResult = render(
            <>
              {comboboxJSX}
              <Button onClick={buttonClickHandler}></Button>
            </>,
          );

          const comboboxEl = renderResult.getByRole('combobox');
          const buttonEl = renderResult.getByRole('button');
          userEvent.click(comboboxEl); // Open menu
          const menuContainerEl = renderResult.queryByRole('listbox');
          userEvent.click(buttonEl); // Click button to close menu
          await waitForElementToBeRemoved(menuContainerEl); // wait for menu to close
          expect(buttonClickHandler).not.toHaveBeenCalled();
        });

        testSingleSelect(
          'Clicking away should keep text if input is a valid value',
          async () => {
            const { inputEl, openMenu } = renderCombobox(select);
            const { menuContainerEl } = openMenu();
            userEvent.type(inputEl, 'Apple');
            userEvent.click(document.body);
            await waitForElementToBeRemoved(menuContainerEl);
            expect(inputEl).toHaveValue('Apple');
          },
        );

        testSingleSelect(
          'Clicking away should NOT keep text if input is not a valid value',
          async () => {
            const { inputEl, openMenu } = renderCombobox(select);
            const { menuContainerEl } = openMenu();
            userEvent.type(inputEl, 'abc');
            userEvent.click(document.body);
            await waitForElementToBeRemoved(menuContainerEl);
            expect(inputEl).toHaveValue('');
          },
        );

        testMultiSelect('Clicking away should keep text as typed', async () => {
          const { inputEl, openMenu } = renderCombobox(select);
          const { menuContainerEl } = openMenu();
          userEvent.type(inputEl, 'abc');
          userEvent.click(document.body);
          await waitForElementToBeRemoved(menuContainerEl);
          expect(inputEl).toHaveValue('abc');
        });
      });

      describe('Click clear button', () => {
        test('Clicking clear all button clears selection', () => {
          const initialValue =
            select === 'single' ? 'apple' : ['apple', 'banana', 'carrot'];
          const { inputEl, clearButtonEl, queryAllChips } = renderCombobox(
            select,
            {
              initialValue,
            },
          );
          expect(clearButtonEl).not.toBeNull();
          userEvent.click(clearButtonEl!);
          if (select === 'multiple') {
            expect(queryAllChips()).toHaveLength(0);
          } else {
            expect(inputEl).toHaveValue('');
          }
        });

        test('Clicking clear all button does nothing when disabled', () => {
          const initialValue =
            select === 'single' ? 'apple' : ['apple', 'banana', 'carrot'];
          const { inputEl, clearButtonEl, queryAllChips } = renderCombobox(
            select,
            {
              initialValue,
              disabled: true,
            },
          );
          expect(clearButtonEl).not.toBeNull();
          userEvent.click(clearButtonEl!);
          if (select === 'multiple') {
            expect(queryAllChips()).toHaveLength(initialValue.length);
          } else {
            expect(inputEl).toHaveValue(startCase(initialValue as string));
          }
        });
      });

      describe('Clicking chips', () => {
        testMultiSelect('Clicking chip X button removes option', async () => {
          const initialValue = ['apple', 'banana', 'carrot'];
          const { queryChipsByName, queryAllChips } = renderCombobox(select, {
            initialValue,
          });
          const appleChip = queryChipsByName('Apple');
          expect(appleChip).not.toBeNull();
          const appleChipButton = appleChip!.querySelector('button')!;
          userEvent.click(appleChipButton);
          await waitFor(() => {
            expect(appleChip).not.toBeInTheDocument();
            const allChips = queryChipsByName(['Banana', 'Carrot']);
            allChips?.forEach(chip => expect(chip).toBeInTheDocument());
            expect(queryAllChips()).toHaveLength(2);
          });
        });

        testMultiSelect('Clicking chip text focuses the chip', () => {
          const initialValue = ['apple', 'banana', 'carrot'];
          const { queryChipsByName, queryAllChips } = renderCombobox(select, {
            initialValue,
          });
          const appleChip = queryChipsByName('Apple');
          userEvent.click(appleChip!);
          expect(appleChip!).toContainFocus();
          expect(queryAllChips()).toHaveLength(3);
        });

        testMultiSelect(
          'Clicking chip X button does nothing when disabled',
          async () => {
            const initialValue = ['apple', 'banana', 'carrot'];
            const { queryChipsByName, queryAllChips } = renderCombobox(select, {
              initialValue,
              disabled: true,
            });
            const carrotChip = queryChipsByName('Carrot');
            const carrotChipButton = carrotChip!.querySelector('button');
            userEvent.click(carrotChipButton!);
            await waitFor(() => {
              expect(queryAllChips()).toHaveLength(3);
            });
          },
        );

        testMultiSelect(
          'Removing a chip sets focus to the next chip',
          async () => {
            const initialValue = ['apple', 'banana', 'carrot'];
            const { queryChipsByName } = renderCombobox(select, {
              initialValue,
            });
            const appleChip = queryChipsByName('Apple');
            const bananaChip = queryChipsByName('Banana');
            const appleChipButton = appleChip!.querySelector('button');
            const bananaChipButton = bananaChip!.querySelector('button');
            userEvent.click(appleChipButton!);
            await waitFor(() => {
              expect(appleChip).not.toBeInTheDocument();
              expect(bananaChipButton!).toHaveFocus();
            });
          },
        );
      });

      test.todo(
        'Clicking in the middle of the input text should set the cursor there',
      );
    });

    /**
     * Keyboard navigation
     */
    describe('Keyboard interaction', () => {
      test('First option is highlighted on menu open', () => {
        const { openMenu } = renderCombobox(select);
        const { optionElements } = openMenu();
        expect(optionElements).not.toBeUndefined();
        expect(
          (optionElements as HTMLCollectionOf<HTMLLIElement>)[0],
        ).toHaveAttribute('aria-selected', 'true');
      });

      describe('Enter key', () => {
        test('opens menu when input is focused', () => {
          const { getMenuElements, inputEl } = renderCombobox(select);
          userEvent.tab();
          userEvent.type(inputEl!, '{enter}');
          const { menuContainerEl } = getMenuElements();
          expect(menuContainerEl).not.toBeNull();
          expect(menuContainerEl).toBeInTheDocument();
        });

        test('selects highlighted option', () => {
          const { inputEl, openMenu, queryChipsByName } =
            renderCombobox(select);
          openMenu();
          userEvent.type(inputEl!, '{arrowdown}{enter}');
          if (select === 'multiple') {
            expect(queryChipsByName('Banana')).toBeInTheDocument();
          } else {
            expect(inputEl).toHaveValue('Banana');
          }
        });

        testSingleSelect('Re-opens menu after making a selection', async () => {
          const { inputEl, openMenu, getMenuElements } =
            renderCombobox('single');
          const { optionElements, menuContainerEl } = openMenu();
          const firstOption = optionElements![0];
          userEvent.click(firstOption);
          await waitForElementToBeRemoved(menuContainerEl);
          userEvent.type(inputEl, '{emter}');
          await waitFor(() => {
            const { menuContainerEl: newMenuContainerEl } = getMenuElements();
            expect(newMenuContainerEl).not.toBeNull();
            expect(newMenuContainerEl).toBeInTheDocument();
          });
        });

        testMultiSelect('Removes Chip when one is focused', () => {
          const initialValue = ['apple', 'banana', 'carrot'];
          const { comboboxEl, queryAllChips, queryChipsByName } =
            renderCombobox(select, {
              initialValue,
            });
          userEvent.type(comboboxEl, '{arrowleft}');
          const chip = queryChipsByName('Carrot');
          // Calling `userEvent.type` doesn't fire the necessary `keyDown` event
          fireEvent.keyDown(chip!, { keyCode: keyMap.Enter });
          expect(queryAllChips()).toHaveLength(2);
        });
      });

      describe('Space key', () => {
        test('Types a space character', () => {
          const { inputEl, openMenu, queryAllChips } = renderCombobox(select);
          openMenu();
          userEvent.type(inputEl, 'a{space}fruit');
          expect(inputEl).toHaveValue('a fruit');
          if (select === 'multiple') {
            expect(queryAllChips()).toHaveLength(0);
          }
        });

        testMultiSelect('Removes Chip when one is focused', () => {
          const initialValue = ['apple', 'banana', 'carrot'];
          const { comboboxEl, queryAllChips, queryChipsByName } =
            renderCombobox(select, {
              initialValue,
            });
          userEvent.type(comboboxEl, '{arrowleft}');
          const chip = queryChipsByName('Carrot');
          // Calling `userEvent.type` doesn't fire the necessary `keyDown` event
          fireEvent.keyDown(chip!, { keyCode: keyMap.Space });
          waitFor(() => expect(queryAllChips()).toHaveLength(2));
        });
      });

      describe('Escape key', () => {
        test('Closes menu', async () => {
          const { inputEl, openMenu } = renderCombobox(select);
          const { menuContainerEl } = openMenu();
          userEvent.type(inputEl, '{esc}');
          await waitForElementToBeRemoved(menuContainerEl);
          expect(menuContainerEl).not.toBeInTheDocument();
        });
        test('Returns focus to the combobox', async () => {
          const { inputEl, openMenu } = renderCombobox(select);
          const { menuContainerEl } = openMenu();
          userEvent.type(inputEl, '{esc}');
          await waitForElementToBeRemoved(menuContainerEl);
          expect(inputEl).toContainFocus();
        });
      });

      describe('Tab key', () => {
        test('Focuses combobox but does not open menu', () => {
          const { getMenuElements, inputEl } = renderCombobox(select);
          userEvent.tab();
          expect(inputEl).toHaveFocus();
          const { menuContainerEl } = getMenuElements();
          expect(menuContainerEl).not.toBeInTheDocument();
        });

        test('Closes menu when no selection is made', async () => {
          const { openMenu } = renderCombobox(select);
          const { menuContainerEl } = openMenu();
          userEvent.tab();
          await waitForElementToBeRemoved(menuContainerEl);
          expect(menuContainerEl).not.toBeInTheDocument();
        });

        test('Focuses clear button when it exists', async () => {
          const initialValue = select === 'multiple' ? ['apple'] : 'apple';
          const { clearButtonEl, openMenu } = renderCombobox(select, {
            initialValue,
          });
          openMenu();
          userEvent.tab();
          expect(clearButtonEl).toHaveFocus();
        });

        testMultiSelect('Focuses next Chip when a Chip is selected', () => {
          const initialValue = ['apple', 'banana', 'carrot'];
          const { queryAllChips } = renderCombobox(select, { initialValue });
          const [firstChip, secondChip] = queryAllChips();
          userEvent.click(firstChip);
          userEvent.tab();
          expect(secondChip).toContainFocus();
        });

        testMultiSelect('Focuses input when the last Chip is selected', () => {
          const initialValue = ['apple', 'banana', 'carrot'];
          const { inputEl, queryChipsByIndex } = renderCombobox(select, {
            initialValue,
          });
          const lastChip = queryChipsByIndex('last');
          userEvent.click(lastChip!);
          userEvent.tab();
          expect(inputEl).toHaveFocus();
        });
      });

      describe('Backspace key', () => {
        test('Deletes text when cursor is NOT at beginning of selection', () => {
          const { inputEl } = renderCombobox(select);
          userEvent.type(inputEl, 'app{backspace}');
          expect(inputEl).toHaveFocus();
          expect(inputEl).toHaveValue('ap');
        });

        testSingleSelect(
          'Deletes text after making a single selection',
          async () => {
            const { inputEl, openMenu } = renderCombobox('single');
            const { optionElements, menuContainerEl } = openMenu();
            const firstOption = optionElements![0];
            userEvent.click(firstOption);
            await waitForElementToBeRemoved(menuContainerEl);
            userEvent.type(inputEl, '{backspace}');
            expect(inputEl).toHaveFocus();
            expect(inputEl).toHaveValue('Appl');
          },
        );

        testSingleSelect('Re-opens menu after making a selection', async () => {
          const { inputEl, openMenu, getMenuElements } =
            renderCombobox('single');
          const { optionElements, menuContainerEl } = openMenu();
          const firstOption = optionElements![0];
          userEvent.click(firstOption);
          await waitForElementToBeRemoved(menuContainerEl);
          userEvent.type(inputEl, '{backspace}');
          await waitFor(() => {
            const { menuContainerEl: newMenuContainerEl } = getMenuElements();
            expect(newMenuContainerEl).not.toBeNull();
            expect(newMenuContainerEl).toBeInTheDocument();
          });
        });

        testMultiSelect(
          'Focuses last chip when cursor is at beginning of selection',
          () => {
            const initialValue = ['apple'];
            const { inputEl, queryAllChips } = renderCombobox(select, {
              initialValue,
            });
            userEvent.type(inputEl, '{backspace}');
            expect(queryAllChips()).toHaveLength(1);
            expect(queryAllChips()[0]).toContainFocus();
          },
        );

        testMultiSelect('Focuses last Chip after making a selection', () => {
          const { inputEl, openMenu, queryAllChips } = renderCombobox(select);
          const { optionElements } = openMenu();
          const firstOption = optionElements![0];
          userEvent.click(firstOption);
          userEvent.type(inputEl, '{backspace}');
          expect(queryAllChips()).toHaveLength(1);
          expect(queryAllChips()[0]).toContainFocus();
        });

        testMultiSelect('Removes Chip when one is focused', async () => {
          const initialValue = ['apple', 'banana', 'carrot'];
          const { comboboxEl, queryAllChips, queryChipsByIndex } =
            renderCombobox(select, {
              initialValue,
            });
          userEvent.type(comboboxEl, '{arrowleft}');
          const lastChip = queryChipsByIndex(2);
          // Calling `userEvent.type` doesn't fire the necessary `keyDown` event
          fireEvent.keyDown(lastChip!, { keyCode: keyMap.Backspace });
          expect(queryAllChips()).toHaveLength(2);
        });

        testMultiSelect('Focuses input when last chip is removed', () => {
          const initialValue = ['apple', 'banana'];
          const { comboboxEl, inputEl, queryChipsByIndex } = renderCombobox(
            select,
            { initialValue },
          );
          userEvent.type(comboboxEl, '{arrowleft}');
          const lastChip = queryChipsByIndex(1);
          fireEvent.keyDown(lastChip!, { keyCode: keyMap.Backspace });
          expect(inputEl).toHaveFocus();
        });

        testMultiSelect(
          'Focuses next chip when an inner chip is removed',
          () => {
            const initialValue = ['apple', 'banana', 'carrot'];
            const { comboboxEl, queryChipsByIndex } = renderCombobox(select, {
              initialValue,
            });
            userEvent.type(comboboxEl, '{arrowleft}');
            const appleChip = queryChipsByIndex(0);
            const bananaChip = queryChipsByIndex(1);
            fireEvent.keyDown(appleChip!, { keyCode: keyMap.Backspace });
            expect(bananaChip).toContainFocus();
          },
        );
      });

      describe('Up & Down arrow keys', () => {
        test('Down arrow moves highlight down', async () => {
          const { inputEl, openMenu, findByRole } = renderCombobox(select);
          openMenu();
          userEvent.type(inputEl, '{arrowdown}');
          const highlight = await findByRole('option', {
            selected: true,
          });
          expect(highlight).toHaveTextContent('Banana');
        });

        test('Up arrow moves highlight up', async () => {
          const { inputEl, openMenu, findByRole } = renderCombobox(select);
          openMenu();
          userEvent.type(inputEl, '{arrowdown}{arrowdown}{arrowup}');
          const highlight = await findByRole('option', {
            selected: true,
          });
          expect(highlight).toHaveTextContent('Banana');
        });

        test('Down arrow key opens menu when its closed', async () => {
          const { inputEl, openMenu, findByRole } = renderCombobox(select);
          const { menuContainerEl } = openMenu();
          expect(inputEl).toHaveFocus();
          userEvent.type(inputEl, '{esc}');
          await waitForElementToBeRemoved(menuContainerEl);
          expect(menuContainerEl).not.toBeInTheDocument();
          userEvent.type(inputEl, '{arrowdown}');
          const reOpenedMenu = await findByRole('listbox');
          expect(reOpenedMenu).toBeInTheDocument();
        });

        test('Pressing Down Arrow when there is a selection shows all menu options', () => {
          // See also: 'Opening the menu when there is a selection should show all options'
          const initialValue = select === 'multiple' ? ['apple'] : 'apple';
          const { inputEl, getMenuElements } = renderCombobox(select, {
            initialValue,
          });
          // First pressing escape to ensure the menu is closed
          userEvent.type(inputEl, '{esc}{arrowdown}');
          const { optionElements } = getMenuElements();
          expect(optionElements).toHaveLength(defaultOptions.length);
          expect(optionElements![0]).toHaveAttribute('aria-selected', 'true');
        });

        test('Pressing Up Arrow when there is a selection shows all menu options', () => {
          // See also: 'Opening the menu when there is a selection should show all options'
          const initialValue = select === 'multiple' ? ['apple'] : 'apple';
          const { inputEl, getMenuElements } = renderCombobox(select, {
            initialValue,
          });
          // First pressing escape to ensure the menu is closed
          userEvent.type(inputEl, '{esc}{arrowup}');
          const { optionElements } = getMenuElements();
          expect(optionElements).toHaveLength(defaultOptions.length);
          expect(optionElements![0]).toHaveAttribute('aria-selected', 'true');
        });
      });

      describe('Left arrow key', () => {
        testMultiSelect(
          'When cursor is at the beginning of input, Left arrow focuses last chip',
          () => {
            const initialValue = ['apple', 'banana', 'carrot'];
            const { queryChipsByIndex, inputEl } = renderCombobox(select, {
              initialValue,
            });
            userEvent.type(inputEl, '{arrowleft}');
            const lastChip = queryChipsByIndex('last');
            expect(lastChip).toContainFocus();
          },
        );
        testSingleSelect(
          'When cursor is at the beginning of input, Left arrow does nothing',
          () => {
            const { inputEl } = renderCombobox(select);
            userEvent.type(inputEl, '{arrowleft}');
            waitFor(() => expect(inputEl).toHaveFocus());
          },
        );
        test('If cursor is NOT at the beginning of input, Left arrow key moves cursor', () => {
          const { inputEl } = renderCombobox(select);
          userEvent.type(inputEl, 'abc{arrowleft}');
          waitFor(() => expect(inputEl).toHaveFocus());
        });

        // eslint-disable-next-line jest/no-disabled-tests
        test.skip('When focus is on clear button, Left arrow moves focus to input', async () => {
          const initialValue = select === 'multiple' ? ['apple'] : 'apple';
          const { inputEl } = renderCombobox(select, {
            initialValue,
          });
          userEvent.type(inputEl!, '{arrowright}{arrowleft}');
          expect(inputEl!).toHaveFocus();
          expect(inputEl!.selectionEnd).toEqual(select === 'multiple' ? 0 : 5);
        });

        testMultiSelect(
          'When focus is on a chip, Left arrow focuses prev chip',
          () => {
            const initialValue = ['apple', 'banana', 'carrot'];
            const { queryChipsByIndex, inputEl } = renderCombobox(select, {
              initialValue,
            });
            const secondChip = queryChipsByIndex(1);
            userEvent.type(inputEl, '{arrowleft}{arrowleft}');
            expect(secondChip).toContainFocus();
          },
        );
        testMultiSelect(
          'When focus is on the first chip, Left arrrow does nothing',
          () => {
            const initialValue = ['apple', 'banana', 'carrot'];
            const { queryAllChips, inputEl } = renderCombobox(select, {
              initialValue,
            });
            const [firstChip] = queryAllChips();
            userEvent.type(
              inputEl,
              '{arrowleft}{arrowleft}{arrowleft}{arrowleft}',
            );
            expect(firstChip).toContainFocus();
          },
        );
      });

      describe('Right arrow key', () => {
        test('Does nothing when focus is on clear button', () => {
          const initialValue =
            select === 'multiple' ? ['apple', 'banana', 'carrot'] : 'apple';
          const { inputEl, clearButtonEl } = renderCombobox(select, {
            initialValue,
          });
          userEvent.type(inputEl, '{arrowright}{arrowright}');
          expect(clearButtonEl).toHaveFocus();
        });

        test('Focuses clear button when cursor is at the end of input', () => {
          const initialValue =
            select === 'multiple' ? ['apple', 'banana', 'carrot'] : 'apple';
          const { inputEl, clearButtonEl } = renderCombobox(select, {
            initialValue,
          });
          userEvent.type(inputEl, '{arrowright}');
          expect(clearButtonEl).toHaveFocus();
        });

        test('Moves cursor when cursor is NOT at the end of input', () => {
          const initialValue =
            select === 'multiple' ? ['apple', 'banana', 'carrot'] : 'apple';
          const { inputEl } = renderCombobox(select, {
            initialValue,
          });
          userEvent.type(inputEl, 'abc{arrowleft}{arrowright}');
          expect(inputEl).toHaveFocus();
        });

        testMultiSelect('Focuses input when focus is on last chip', () => {
          const initialValue = ['apple', 'banana'];
          const { inputEl } = renderCombobox(select, {
            initialValue,
          });
          userEvent.type(
            inputEl!,
            'abc{arrowleft}{arrowleft}{arrowleft}{arrowleft}{arrowright}',
          );
          expect(inputEl!).toHaveFocus();
          // This behavior passes in the browser, but not in jest
          // expect(inputEl!.selectionStart).toEqual(0);
        });

        testMultiSelect('Focuses input when focus is on only chip', () => {
          const initialValue = ['apple'];
          const { inputEl } = renderCombobox(select, {
            initialValue,
          });
          userEvent.type(
            inputEl!,
            'abc{arrowleft}{arrowleft}{arrowleft}{arrowleft}{arrowright}',
          );
          expect(inputEl!).toHaveFocus();
          // expect(inputEl!.selectionStart).toEqual(0);
        });

        testMultiSelect(
          'Focuses next chip when focus is on an inner chip',
          () => {
            const initialValue = ['apple', 'banana', 'carrot'];
            const { inputEl, queryChipsByIndex } = renderCombobox(select, {
              initialValue,
            });
            userEvent.type(inputEl!, '{arrowleft}{arrowleft}{arrowright}');
            const lastChip = queryChipsByIndex('last');
            expect(lastChip!).toContainFocus();
          },
        );
      });

      describe('Any other key', () => {
        test('Updates the value of the input', () => {
          const { inputEl } = renderCombobox(select);
          userEvent.type(inputEl, 'z');
          expect(inputEl).toHaveValue('z');
        });

        test('Updates the input when options are highlighted', () => {
          const { inputEl, openMenu } = renderCombobox(select);
          openMenu();
          userEvent.type(inputEl, '{arrowdown}z');
          expect(inputEl).toHaveValue('z');
        });

        test("Opens the menu if it's closed", async () => {
          const { inputEl, openMenu, getMenuElements } = renderCombobox(select);
          const { menuContainerEl } = openMenu();
          userEvent.type(inputEl, '{esc}');
          await waitForElementToBeRemoved(menuContainerEl);
          expect(menuContainerEl).not.toBeInTheDocument();
          userEvent.type(inputEl, 'a');
          await waitFor(() => {
            const { menuContainerEl: newMenuContainerEl } = getMenuElements();
            expect(newMenuContainerEl).toBeInTheDocument();
          });
        });

        testSingleSelect(
          'Opens the menu after making a selection',
          async () => {
            const { inputEl, openMenu, getMenuElements } =
              renderCombobox(select);
            const { optionElements, menuContainerEl } = openMenu();
            const firstOption = optionElements![0];
            userEvent.click(firstOption);
            await waitForElementToBeRemoved(menuContainerEl);
            userEvent.type(inputEl, 'a');
            await waitFor(() => {
              const { menuContainerEl: newMenuContainerEl } = getMenuElements();
              expect(newMenuContainerEl).toBeInTheDocument();
            });
          },
        );

        test('Filters the menu options', () => {
          // Using default options
          const { inputEl, getMenuElements } = renderCombobox(select);
          userEvent.type(inputEl, 'c');
          const { optionElements } = getMenuElements();
          expect(optionElements).toHaveLength(1); // carrot
        });
      });
    });

    describe('Programmatic interaction', () => {
      test('Menu does not open when input is focused programmatically', () => {
        const { inputEl, getMenuElements } = renderCombobox(select);
        act(() => inputEl.focus());
        const { menuContainerEl } = getMenuElements();
        expect(menuContainerEl).not.toBeInTheDocument();
      });
    });

    /**
     * Filtered options
     */
    test('Providing filteredOptions limits the rendered options', () => {
      const { openMenu } = renderCombobox(select, {
        filteredOptions: ['apple'],
      });
      const { optionElements } = openMenu();
      expect(optionElements!.length).toEqual(1);
    });

    /**
     * onClear
     */
    test('Clear button calls onClear callback', () => {
      const initialValue = select === 'multiple' ? ['apple'] : 'apple';
      const onClear = jest.fn();
      const { clearButtonEl } = renderCombobox(select, {
        initialValue,
        onClear,
      });
      userEvent.click(clearButtonEl!);
      expect(onClear).toHaveBeenCalled();
    });

    /**
     * onChange
     */
    describe('onChange', () => {
      test('Selecting an option calls onChange callback', () => {
        const onChange = jest.fn();
        const { openMenu } = renderCombobox(select, { onChange });
        const { optionElements } = openMenu();
        userEvent.click(optionElements![0]);
        waitFor(() => {
          expect(onChange).toHaveBeenCalled();
        });
      });

      test('Clearing selection calls onChange callback', () => {
        const onChange = jest.fn();
        const initialValue = select === 'multiple' ? ['apple'] : 'apple';
        const { clearButtonEl } = renderCombobox(select, {
          onChange,
          initialValue,
        });
        userEvent.click(clearButtonEl!);
        expect(onChange).toHaveBeenCalled();
      });

      test('Typing does not call onChange callback', () => {
        const onChange = jest.fn();
        const { inputEl } = renderCombobox(select, { onChange });
        userEvent.type(inputEl, 'a');
        expect(onChange).not.toHaveBeenCalled();
      });

      test('Closing the menu without making a selection does not call onChange callback', async () => {
        const onChange = jest.fn();
        const { containerEl, openMenu } = renderCombobox(select, { onChange });
        const { menuContainerEl } = openMenu();
        userEvent.click(containerEl.parentElement!);
        await waitForElementToBeRemoved(menuContainerEl);
        expect(onChange).not.toHaveBeenCalled();
      });
    });

    /**
     * onFilter
     */
    describe('onFilter', () => {
      test('Typing calls onFilter callback on each keystroke', () => {
        const onFilter = jest.fn();
        const { inputEl } = renderCombobox(select, { onFilter });
        userEvent.type(inputEl, 'app');
        expect(onFilter).toHaveBeenCalledTimes(3);
      });
      test('Clearing selection calls onFilter callback once', () => {
        const onFilter = jest.fn();
        const initialValue = select === 'multiple' ? ['apple'] : 'apple';
        const { clearButtonEl } = renderCombobox(select, {
          onFilter,
          initialValue,
        });
        userEvent.click(clearButtonEl!);
        expect(onFilter).toHaveBeenCalledTimes(1);
      });
      test('Selecting an option does not call onFilter callback', () => {
        const onFilter = jest.fn();
        const { openMenu } = renderCombobox(select, { onFilter });
        const { optionElements } = openMenu();
        userEvent.click((optionElements as HTMLCollectionOf<HTMLLIElement>)[0]);
        expect(onFilter).not.toHaveBeenCalled();
      });
      test('Closing the menu does not call onFilter callback', async () => {
        const onFilter = jest.fn();
        const { containerEl, openMenu } = renderCombobox(select, { onFilter });
        const { menuContainerEl } = openMenu();
        userEvent.click(containerEl.parentElement!);
        await waitForElementToBeRemoved(menuContainerEl);
        expect(onFilter).not.toHaveBeenCalled();
      });
    });

    /**
     * Search State messages & filteredOptions
     */
    describe('Search states', () => {
      test('Menu renders empty state message when there are no options provided', () => {
        const searchEmptyMessage = 'Empty state message';
        const { openMenu } = renderCombobox(select, {
          searchEmptyMessage,
          options: [],
        });
        const { menuContainerEl } = openMenu();
        const emptyStateTextEl = queryByText(
          menuContainerEl!,
          searchEmptyMessage,
        );
        expect(emptyStateTextEl).toBeInTheDocument();
      });

      // Unsure if this is the desired behavior
      // eslint-disable-next-line jest/no-disabled-tests
      test.skip('Menu renders empty state message when filtered options is empty', () => {
        const searchEmptyMessage = 'Empty state message';
        const { openMenu } = renderCombobox(select, {
          searchEmptyMessage,
          filteredOptions: [],
        });
        const { menuContainerEl } = openMenu();
        const emptyStateTextEl = queryByText(
          menuContainerEl!,
          searchEmptyMessage,
        );
        expect(emptyStateTextEl).toBeInTheDocument();
      });

      test('Menu renders loading state message `searchState` == `loading`', () => {
        const searchLoadingMessage = 'Loading state message';
        const { openMenu } = renderCombobox(select, {
          searchLoadingMessage,
          searchState: 'loading',
        });
        const { menuContainerEl } = openMenu();
        const loadingStateTextEl = queryByText(
          menuContainerEl!,
          searchLoadingMessage,
        );
        expect(loadingStateTextEl).toBeInTheDocument();
      });

      test('Menu renders error state message `searchState` == `error`', () => {
        const searchErrorMessage = 'Error state message';
        const { openMenu } = renderCombobox(select, {
          searchErrorMessage,
          searchState: 'error',
        });
        const { menuContainerEl } = openMenu();
        const errorStateTextEl = queryByText(
          menuContainerEl!,
          searchErrorMessage,
        );
        expect(errorStateTextEl).toBeInTheDocument();
      });
    });
  });

  describe('Chips', () => {
    const ellipsis = '…';
    const options = [
      'loremipsumdolor',
      'sitametconsectetur',
      'anotherlongoption',
    ];

    test('Chips truncate at the beginning', () => {
      const { queryAllChips } = renderCombobox('multiple', {
        options,
        initialValue: ['loremipsumdolor'],
        chipTruncationLocation: 'start',
      });
      const firstChipEl = queryAllChips()[0];
      expect(firstChipEl).toHaveTextContent(ellipsis + 'psumdolor');
    });

    test('Chips truncate in the middle', () => {
      const { queryAllChips } = renderCombobox('multiple', {
        options,
        initialValue: ['loremipsumdolor'],
        chipTruncationLocation: 'middle',
      });
      const [firstChipEl] = queryAllChips();
      expect(firstChipEl).toHaveTextContent('lore' + ellipsis + 'dolor');
    });
    test('Chips truncate at the end', () => {
      const { queryAllChips } = renderCombobox('multiple', {
        options,
        initialValue: ['loremipsumdolor'],
        chipTruncationLocation: 'end',
      });
      const [firstChipEl] = queryAllChips();
      expect(firstChipEl).toHaveTextContent('loremipsu' + ellipsis);
    });

    test('Chips truncate to the provided length', () => {
      const { queryAllChips } = renderCombobox('multiple', {
        options,
        initialValue: ['loremipsumdolor'],
        chipTruncationLocation: 'start',
        chipCharacterLimit: 8,
      });
      const [firstChipEl] = queryAllChips();
      expect(firstChipEl).toHaveTextContent(ellipsis + 'dolor');
    });
  });
});
