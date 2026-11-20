import {
  screen,
  waitFor,
  within,
  userEvent,
} from '@mongodb-js/testing-library-compass';

const _getContainer = (parentElement?: HTMLElement) => {
  if (!parentElement) {
    return screen;
  }
  return within(parentElement);
};

/**
 * Menus are not rendered synchronously after the control is clicked, and the
 * `aria-controls` attribute pointing at them only appears once they are open,
 * so both have to be waited for.
 */
const waitForControlledMenu = (control: HTMLElement): Promise<HTMLElement> => {
  return waitFor(() => {
    const menuId = control.getAttribute('aria-controls');
    const menu = menuId
      ? document.querySelector<HTMLElement>(`#${menuId}`)
      : null;
    if (!menu) {
      throw new Error(
        `Expected an open menu controlled by ${control.tagName.toLowerCase()}`
      );
    }
    return menu;
  });
};

export const openComboBox = async (
  name: RegExp,
  parentElement?: HTMLElement
) => {
  const combobox = _getContainer(parentElement).getByRole('textbox', {
    name,
  });
  userEvent.click(combobox);
  await waitForControlledMenu(combobox);
  return combobox;
};

export const setSelectValue = async (
  name: RegExp,
  value: string,
  parentElement?: HTMLElement
) => {
  const select = _getContainer(parentElement).getByRole('button', {
    name,
  });
  userEvent.click(select);
  const menu = await waitForControlledMenu(select);
  userEvent.click(within(menu).getByText(new RegExp(value, 'i')), undefined, {
    skipPointerEventsCheck: true,
  });
};

export const setComboboxValue = async (
  name: RegExp,
  value: string,
  parentElement?: HTMLElement
) => {
  const combobox = await openComboBox(name, parentElement);
  const menu = await waitForControlledMenu(combobox);
  userEvent.click(within(menu).getByText(new RegExp(value, 'i')), undefined, {
    skipPointerEventsCheck: true,
  });
  userEvent.keyboard('{Escape}');
};

export const setMultiSelectComboboxValues = async (
  name: RegExp,
  values: string[],
  parentElement?: HTMLElement
) => {
  const combobox = await openComboBox(name, parentElement);
  const menu = await waitForControlledMenu(combobox);
  const listbox = within(menu).getByRole('list');
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
  userEvent.keyboard('{Escape}');
};

const setInputValue = (input: HTMLElement, value: string) => {
  userEvent.clear(input);
  if (value !== '') {
    userEvent.type(input, value);
  }
};

export const setInputElementValue = (
  name: RegExp,
  value: string,
  parentElement?: HTMLElement
) => {
  const input = _getContainer(parentElement).getByLabelText(name, {
    selector: 'input',
  });
  setInputValue(input, value);
};

export const setInputElementValueByTestId = (
  testId: string,
  value: string,
  parentElement?: HTMLElement
) => {
  const input = _getContainer(parentElement).getByTestId(testId);
  setInputValue(input, value);
};
