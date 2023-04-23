import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'chai';
import { BasicGroup } from './basic-group';
import sinon from 'sinon';

describe('basic group', function () {
  context('renders a group form', function () {
    beforeEach(function () {
      render(<BasicGroup fields={[]} onChange={() => {}} />);
    });
    it('renders label', function () {
      expect(screen.getByText('Group documents based on')).to.exist;
    });
    it('renders fields combobox', function () {
      expect(screen.getByRole('combobox')).to.exist;
      expect(
        screen.getByRole('textbox', {
          name: /select field names/i,
        })
      ).to.exist;
    });
  });

  it('calls onChange when form fields change', function () {
    const onChange = sinon.spy();
    render(<BasicGroup onChange={onChange} fields={['a', 'b', 'c']} />);

    // open combobox
    const combobox = screen.getByRole('combobox');
    userEvent.click(combobox);

    // get the options
    const listbox = screen.getByRole('list');
    const [a, b, c] = within(listbox).getAllByRole('option');

    // select a, b, c
    userEvent.click(a);
    userEvent.click(b);
    userEvent.click(c);
    expect(onChange.lastCall.args[0]).to.equal(
      JSON.stringify({ _id: ['$a', '$b', '$c'] })
    );
    expect(onChange.lastCall.args[1]).to.be.null;

    // deselect a
    userEvent.click(a);
    expect(onChange.lastCall.args[0]).to.equal(
      JSON.stringify({ _id: ['$b', '$c'] })
    );
    expect(onChange.lastCall.args[1]).to.be.null;

    // deselect b
    userEvent.click(b);
    expect(onChange.lastCall.args[0]).to.equal(JSON.stringify({ _id: '$c' }));
    expect(onChange.lastCall.args[1]).to.be.null;

    // deselect c
    userEvent.click(c);
    expect(onChange.lastCall.args[0]).to.equal(JSON.stringify({ _id: [] }));
    expect(onChange.lastCall.args[1]).to.be.an.instanceOf(Error);
  });
});
