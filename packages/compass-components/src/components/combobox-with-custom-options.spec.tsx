import React from 'react';
import { expect } from 'chai';
import {
  fireEvent,
  render,
  screen,
  cleanup,
  within,
} from '@testing-library/react';

import { ComboboxWithCustomOption } from './combobox-with-custom-option';

describe('ComboboxWithCustomOption Component', function () {
  afterEach(cleanup);

  it('displays list of options', function () {
    render(
      <ComboboxWithCustomOption
        aria-label="combo-box"
        options={['one', 'two', 'three']}
      />
    );
    fireEvent.click(screen.getByRole('combobox'));
    const listbox = screen.getByRole('listbox');

    expect(within(listbox).getByText('one')).to.exist;
    expect(within(listbox).getByText('two')).to.exist;
    expect(within(listbox).getByText('three')).to.exist;
  });

  it('displays custom option options', function () {
    render(
      <ComboboxWithCustomOption
        aria-label="combo-box"
        options={['one', 'two', 'three']}
      />
    );

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
