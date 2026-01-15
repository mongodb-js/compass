import React from 'react';
import { expect } from 'chai';
import {
  screen,
  waitFor,
  userEvent,
  within,
  render,
} from '@mongodb-js/testing-library-compass';
import { CardinalitySelect } from './relationship-drawer-content';
import sinon from 'sinon';

describe('RelationshipDrawerContent', function () {
  context('CardinalitySelect', function () {
    it('renders list with correct options', function () {
      render(
        <CardinalitySelect
          label="Cardinality"
          value={100}
          onChange={() => {}}
        />
      );
      userEvent.click(screen.getByRole('button', { name: /Cardinality/i }));
      const listbox = screen.getByRole('listbox');
      const options = within(listbox).getAllByRole('option');
      const optionValues = options.map((option) => option.textContent);
      expect(optionValues).to.deep.equal([
        'One1',
        'ManyN/A',
        'Many100',
        'Many1000',
        'Many10000+',
      ]);
    });
    it('handles cardinality label when selected', function () {
      const { rerender } = render(
        <CardinalitySelect
          label="Cardinality"
          value={100}
          onChange={() => {}}
        />
      );
      const button = screen.getByRole('button', { name: /Cardinality/i });
      const tag = within(button).queryByText('100');
      if (!tag) {
        throw new Error('Tag not found');
      }
      expect(window.getComputedStyle(tag).display).to.equal('');

      // Now rerender with null value and it should hide N/A
      rerender(
        <CardinalitySelect
          label="Cardinality"
          value={null}
          onChange={() => {}}
        />
      );
      const buttonNA = screen.getByRole('button', { name: /Cardinality/i });
      const tagNA = within(buttonNA).queryByText('N/A');
      if (!tagNA) {
        throw new Error('Tag not found');
      }
      expect(window.getComputedStyle(tagNA).display).to.equal('none');
    });
    it('calls onChange with correct value when an option is selected - numeric value', async function () {
      const onChangeSpy = sinon.spy();
      render(
        <CardinalitySelect
          label="Cardinality"
          value={100}
          onChange={onChangeSpy}
        />
      );
      userEvent.click(screen.getByRole('button', { name: /Cardinality/i }));
      const listbox = screen.getByRole('listbox');
      const optionToSelect = within(listbox).getByText('100');
      userEvent.click(optionToSelect);
      await waitFor(() => {
        expect(onChangeSpy).to.have.been.calledOnceWith(100);
      });
    });
    it('calls onChange with correct value when n/a option is selected - null value', async function () {
      const onChangeSpy = sinon.spy();
      render(
        <CardinalitySelect
          label="Cardinality"
          value={100}
          onChange={onChangeSpy}
        />
      );
      userEvent.click(screen.getByRole('button', { name: /Cardinality/i }));
      const listbox = screen.getByRole('listbox');
      const optionToSelect = within(listbox).getByText('N/A');
      userEvent.click(optionToSelect);
      await waitFor(() => {
        expect(onChangeSpy).to.have.been.calledOnceWith(null);
      });
    });
  });
});
