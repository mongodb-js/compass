import React from 'react';
import type { ComponentProps } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'chai';
import { SortForm } from './sort';
import sinon from 'sinon';
import {
  setSelectValue,
  setComboboxValue,
} from '../../../../../test/form-helper';
import type { StageWizardFields } from '..';
import { SINGLE_SELECT_LABEL } from '../field-combobox';

const SAMPLE_FIELDS: StageWizardFields = [
  {
    name: 'street',
    type: 'String',
  },
  {
    name: 'city',
    type: 'String',
  },
  {
    name: 'zip',
    type: 'String',
  },
];

const renderSortForm = (
  props: Partial<ComponentProps<typeof SortForm>> = {}
) => {
  return render(
    <SortForm fields={SAMPLE_FIELDS} onChange={() => {}} {...props} />
  );
};

describe('sort', function () {
  describe('default form state', function () {
    let sortFormGroup: HTMLElement;
    beforeEach(function () {
      renderSortForm();
      sortFormGroup = screen.getByTestId('sort-form-0');
    });

    it('renders labels', function () {
      expect(within(sortFormGroup).findByText('Sort documents by')).to.exist;
      expect(within(sortFormGroup).findByText('in')).to.exist;
      expect(within(sortFormGroup).findByText('order')).to.exist;
    });

    it('renders add button', function () {
      expect(
        within(sortFormGroup).getByRole('button', {
          name: /add/i,
        })
      ).to.exist;
    });

    it('does not render remove button when only one form group is visible', function () {
      expect(
        within(sortFormGroup).queryByRole('button', {
          name: /remove/i,
        })
      ).to.not.exist;
    });
  });

  describe('when add button is clicked', function () {
    let sortFormItems: HTMLElement[] = [];
    let onChange: sinon.SinonSpy;
    beforeEach(function () {
      onChange = sinon.spy();
      renderSortForm({ onChange });
      const addButton = screen.getByRole('button', {
        name: /add/i,
      });
      userEvent.click(addButton);
      expect(screen.getByTestId('sort-form-1')).to.exist;
      sortFormItems = screen.getAllByTestId(/sort-form-\d+$/);

      setComboboxValue(
        new RegExp(SINGLE_SELECT_LABEL, 'i'),
        'street',
        sortFormItems[0]
      );
      setSelectValue(/select direction/i, 'asc', sortFormItems[0]);

      setComboboxValue(
        new RegExp(SINGLE_SELECT_LABEL, 'i'),
        'zip',
        sortFormItems[1]
      );
      setSelectValue(/select direction/i, 'desc', sortFormItems[1]);
    });

    it('renders labels for each sort field', function () {
      expect(within(sortFormItems[0]).getByText('Sort documents by')).to.exist;
      expect(within(sortFormItems[1]).getByText('and')).to.exist;
    });

    it('renders field combobox for each sort field', function () {
      const fieldInputs = sortFormItems.map((sortForm) => {
        return within(sortForm).getByRole('textbox', {
          name: new RegExp(SINGLE_SELECT_LABEL, 'i'),
        });
      });
      expect(fieldInputs[0].getAttribute('value')).to.equal('street');
      expect(fieldInputs[1].getAttribute('value')).to.equal('zip');
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

      userEvent.click(addButtons[0]);

      // We added a new item after index 0
      const addedSortItem = screen.getByTestId('sort-form-1');

      setComboboxValue(
        new RegExp(SINGLE_SELECT_LABEL, 'i'),
        'city',
        addedSortItem
      );
      setSelectValue(/select direction/i, 'desc', addedSortItem);

      expect(onChange.lastCall.args[0]).to.equal(
        JSON.stringify({
          street: 1,
          city: -1,
          zip: -1,
        })
      );
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
      expect(onChange.lastCall.args[0]).to.equal(
        JSON.stringify({
          zip: -1,
        })
      );
    });
  });
});
