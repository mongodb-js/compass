import React from 'react';
import type { ComponentProps } from 'react';
import { render, screen, within } from '@testing-library/react';
import { expect } from 'chai';
import { SortForm } from './sort';
import sinon from 'sinon';

const fields = [
  {
    name: 'street',
    value: 'street',
  },
  {
    name: 'city',
    value: 'city',
  },
  {
    name: 'zip',
    value: 'zip',
  },
];

const renderSortForm = (
  props: Partial<ComponentProps<typeof SortForm>> = {}
) => {
  return render(
    <SortForm fields={fields} formData={[]} onChange={() => {}} {...props} />
  );
};

describe('sort', function () {
  describe('default form state', function () {
    let sortForm: HTMLElement;
    beforeEach(function () {
      renderSortForm({
        formData: [{ field: 'street', direction: 'Asc' }],
      });
      sortForm = screen.getByTestId('sort-form-0');
    });

    it('renders labels', function () {
      expect(within(sortForm).findByText('Sort documents by')).to.exist;
      expect(within(sortForm).findByText('in')).to.exist;
      expect(within(sortForm).findByText('order')).to.exist;
    });

    it('renders add button', function () {
      expect(
        within(sortForm).getByRole('button', {
          name: /add/i,
        })
      ).to.exist;
    });

    it('does not render remove button when only one form group is visible', function () {
      expect(
        within(sortForm).queryByRole('button', {
          name: /remove/i,
        })
      ).to.not.exist;
    });
  });

  describe('multiple sort fields', function () {
    let sortFormItems: HTMLElement[];
    let onChange: sinon.SinonSpy;
    beforeEach(function () {
      onChange = sinon.spy();
      renderSortForm({
        formData: [
          { field: 'street', direction: 'Asc' },
          { field: 'city', direction: 'Desc' },
        ],
        onChange,
      });
      sortFormItems = screen.getAllByTestId(/sort-form-\d+/);
    });

    it('renders labels for each sort field', function () {
      expect(within(sortFormItems[0]).findByText('Sort documents by')).to.exist;
      expect(within(sortFormItems[1]).findByText('and')).to.exist;
    });

    it('renders field combobox for each sort field', function () {
      const fieldInputs = sortFormItems.map((sortForm) => {
        return within(sortForm).getByRole('textbox', {
          name: /select a field/i,
        });
      });
      expect(fieldInputs[0].getAttribute('value')).to.equal('street');
      expect(fieldInputs[1].getAttribute('value')).to.equal('city');
    });

    it('renders direction select for each sort field', function () {
      const selectButtons = sortFormItems.map((sortForm) => {
        return within(sortForm).getByRole('button', {
          name: /select direction/i,
        });
      });
      expect(selectButtons[0].getAttribute('value')).to.equal('Asc');
      expect(selectButtons[1].getAttribute('value')).to.equal('Desc');
    });

    it('renders add button for each sort field', function () {
      const addButtons = sortFormItems.map((sortForm) => {
        return within(sortForm).getByRole('button', {
          name: /add/i,
        });
      });
      expect(addButtons[0]).to.exist;
      expect(addButtons[1]).to.exist;

      addButtons[0].click();
      expect(onChange).to.have.been.calledWith([
        { field: 'street', direction: 'Asc' },
        { field: '', direction: 'Asc' },
        { field: 'city', direction: 'Desc' },
      ]);
    });

    it('renders remove button for each sort field', function () {
      const removeButtons = sortFormItems.map((sortForm) => {
        return within(sortForm).getByRole('button', {
          name: /remove/i,
        });
      });
      expect(removeButtons[0]).to.exist;
      expect(removeButtons[1]).to.exist;

      removeButtons[0].click();
      expect(onChange).to.have.been.calledWith([
        { field: 'city', direction: 'Desc' },
      ]);
    });
  });
});
