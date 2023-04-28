import userEvent from '@testing-library/user-event';
import { screen, within } from '@testing-library/react';

const _getContainer = (parentElement?: HTMLElement) => {
  if (!parentElement) {
    return screen;
  }
  return within(parentElement);
};

export const openComboBox = (name: RegExp, parentElement?: HTMLElement) => {
  const combobox = _getContainer(parentElement).getByRole('textbox', {
    name,
  });
  combobox.click();
  return combobox;
};

export const setSelectValue = (
  name: RegExp,
  value: string,
  parentElement?: HTMLElement
) => {
  const select = _getContainer(parentElement).getByRole('button', {
    name,
  });
  select.click();
  const menuId = `#${select.getAttribute('aria-controls')!}`;
  userEvent.click(
    within(document.querySelector(menuId)!).getByText(new RegExp(value, 'i')),
    undefined,
    {
      skipPointerEventsCheck: true,
    }
  );
};

export const setComboboxValue = (
  name: RegExp,
  value: string,
  parentElement?: HTMLElement
) => {
  const combobox = openComboBox(name, parentElement);
  const menuId = `#${combobox.getAttribute('aria-controls')!}`;
  userEvent.click(
    within(document.querySelector(menuId)!).getByText(new RegExp(value, 'i')),
    undefined,
    {
      skipPointerEventsCheck: true,
    }
  );
};

export const setMultiSelectComboboxValues = (
  name: RegExp,
  values: string[],
  parentElement?: HTMLElement
) => {
  const combobox = openComboBox(name, parentElement);
  const menuId = `#${combobox.getAttribute('aria-controls')!}`;
  const listbox = within(document.querySelector(menuId)!).getByRole('list');
  values.forEach((value) => {
    const option = within(listbox).getByRole('option', {
      name: new RegExp(value, 'i'),
    });
    if (option) {
      userEvent.click(option, undefined, {
        skipPointerEventsCheck: true,
      });
    }
  });
};

export const setInputElementValue = (
  name: RegExp,
  value: string,
  parentElement?: HTMLElement
) => {
  const input = _getContainer(parentElement).getByRole('textbox', {
    name,
  });
  userEvent.clear(input);
  userEvent.type(input, value);
};
