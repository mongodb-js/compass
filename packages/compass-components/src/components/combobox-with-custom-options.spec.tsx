import React, { type ComponentProps } from 'react';
import { expect } from 'chai';
import {
  fireEvent,
  render,
  screen,
  cleanup,
  within,
} from '@mongodb-js/testing-library-compass';

import { ComboboxWithCustomOption } from './combobox-with-custom-option';
import { ComboboxOption } from './leafygreen';

const renderCombobox = (
  props: Partial<ComponentProps<typeof ComboboxWithCustomOption>> = {}
) => {
  render(
    <ComboboxWithCustomOption
      aria-label="combo-box"
      options={[{ value: 'one' }, { value: 'two' }, { value: 'three' }]}
      renderOption={(o, i) => {
        return <ComboboxOption key={i} value={o.value} />;
      }}
      {...props}
    />
  );
};

const typeInCombobox = (value: string) => {
  fireEvent.change(
    screen.getByRole('textbox', {
      name: /combo-box/i,
    }),
    {
      target: { value },
    }
  );
};

const getOptionLabels = () => {
  fireEvent.click(screen.getByRole('combobox'));
  return within(screen.getByRole('listbox'))
    .getAllByRole('option')
    .map((option) => option.getAttribute('aria-label'));
};

describe('ComboboxWithCustomOption Component', function () {
  afterEach(cleanup);

  it('displays list of options', function () {
    renderCombobox();
    fireEvent.click(screen.getByRole('combobox'));
    const listbox = screen.getByRole('listbox');

    expect(within(listbox).getByText('one')).to.exist;
    expect(within(listbox).getByText('two')).to.exist;
    expect(within(listbox).getByText('three')).to.exist;
  });

  it('displays custom option options', function () {
    renderCombobox();

    typeInCombobox('new_field');

    fireEvent.click(screen.getByRole('combobox'));
    const listbox = screen.getByRole('listbox');

    expect(within(listbox).getByText('new_field')).to.exist;
  });

  it('displays the custom option last when the search is a substring of an existing option', function () {
    renderCombobox({
      options: [{ value: 'one' }, { value: 'oneAndAHalf' }],
    });

    typeInCombobox('one');
    expect(getOptionLabels()).to.deep.equal(['one', 'oneAndAHalf']);

    typeInCombobox('oneAnd');
    expect(getOptionLabels()).to.deep.equal(['oneAndAHalf', 'oneAnd']);
  });
});
