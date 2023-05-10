import React, { type ComponentProps } from 'react';
import { expect } from 'chai';
import {
  fireEvent,
  render,
  screen,
  cleanup,
  within,
} from '@testing-library/react';

import { ComboboxWithCustomOption } from './combobox-with-custom-option';
import { ComboboxOption } from './combobox/ComboboxOption';

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

    fireEvent.change(
      screen.getByRole('textbox', {
        name: /combo-box/i,
      }),
      {
        target: { value: 'new_field' },
      }
    );

    fireEvent.click(screen.getByRole('combobox'));
    const listbox = screen.getByRole('listbox');

    expect(within(listbox).getByText('new_field')).to.exist;
  });
});
