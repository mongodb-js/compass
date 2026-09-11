import React from 'react';
import {
  render,
  screen,
  userEvent,
  waitFor,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import { GroupWithStatistics } from './group-with-statistics';
import sinon from 'sinon';
import {
  setMultiSelectComboboxValues,
  setComboboxValue,
  setSelectValue,
} from '../../../../../test/form-helper';
import type { StageWizardFields } from '..';
import { MULTI_SELECT_LABEL, SINGLE_SELECT_LABEL } from '../field-combobox';

const SAMPLE_FIELDS: StageWizardFields = [
  {
    name: 'address',
    type: 'String',
  },
  {
    name: 'street',
    type: 'String',
  },
  {
    name: 'name',
    type: 'String',
  },
  {
    name: 'initials',
    type: 'String',
  },
  {
    name: 'orders',
    type: 'String',
  },
];

describe('group with statistics', function () {
  context('renders a group form', function () {
    beforeEach(function () {
      render(
        <GroupWithStatistics
          serverVersion="5.0.0"
          fields={[]}
          onChange={() => {}}
        />
      );
    });
    it('renders labels', function () {
      expect(screen.getByText('Calculate')).to.exist;
      expect(screen.getByText('grouped by')).to.exist;
    });
    it('renders accumulator type select', function () {
      expect(
        screen.getByRole('button', {
          name: /select accumulator/i,
        })
      ).to.exist;
    });
    it('renders accumulator field combobox', function () {
      expect(
        screen.getByRole('textbox', {
          name: new RegExp(SINGLE_SELECT_LABEL, 'i'),
        })
      ).to.exist;
    });
    it('renders group fields combobox', function () {
      expect(
        screen.getByRole('textbox', {
          name: new RegExp(MULTI_SELECT_LABEL, 'i'),
        })
      ).to.exist;
    });
    it('renders accumulator add/remove buttons', async function () {
      userEvent.click(
        screen.getByRole('button', {
          name: /add/i,
        })
      );

      await waitFor(() => {
        expect(
          screen.getAllByRole('button', {
            name: /add/i,
          })
        ).to.have.lengthOf(2);
        expect(
          screen.getAllByRole('button', {
            name: /remove/i,
          })
        ).to.have.lengthOf(2);
      });
    });
  });

  context('calls onChange', function () {
    let onChange: sinon.SinonSpy;
    beforeEach(function () {
      onChange = sinon.spy();
      render(
        <GroupWithStatistics
          serverVersion="5.0.0"
          onChange={onChange}
          fields={SAMPLE_FIELDS}
        />
      );
    });
    it('when selecting group fields', async function () {
      await setMultiSelectComboboxValues(new RegExp(MULTI_SELECT_LABEL, 'i'), [
        'name',
        'street',
      ]);
      expect(onChange.lastCall.args[0]).to.equal(
        JSON.stringify({
          _id: {
            name: '$name',
            street: '$street',
          },
        })
      );
      expect(onChange.lastCall.args[1]).to.not.be.null;
    });
    context('accumulator group', function () {
      it('when selecting only type', async function () {
        await setSelectValue(/select accumulator/i, 'sum');
        expect(onChange.lastCall.args[0]).to.equal(
          JSON.stringify({
            _id: null,
          })
        );
        expect(onChange.lastCall.args[1]).to.not.be.null;
      });
      it('when selecting only field', async function () {
        await setComboboxValue(new RegExp(SINGLE_SELECT_LABEL, 'i'), 'orders');
        expect(onChange.lastCall.args[0]).to.equal(
          JSON.stringify({
            _id: null,
          })
        );
        expect(onChange.lastCall.args[1]).to.not.be.null;
      });
      it('when selecting both - field and type', async function () {
        await setSelectValue(/select accumulator/i, 'sum');
        await setComboboxValue(new RegExp(SINGLE_SELECT_LABEL, 'i'), 'orders');
        expect(onChange.lastCall.args[0]).to.equal(
          JSON.stringify({
            _id: null,
            sum_orders: {
              $sum: '$orders',
            },
          })
        );
        expect(onChange.lastCall.args[1]).to.be.null;
      });
    });

    context('$count', function () {
      it('adds a "count" field with the $count accumulator to the generated stage', async function () {
        await setSelectValue(/select accumulator/i, 'count');
        expect(onChange.lastCall.args[0]).to.equal(
          JSON.stringify({
            _id: null,
            count: { $count: {} },
          })
        );
      });

      it('clears the field selection', async function () {
        await setSelectValue(/select accumulator/i, 'sum');
        await setComboboxValue(new RegExp(SINGLE_SELECT_LABEL, 'i'), 'orders');
        await setSelectValue(/select accumulator/i, 'count');

        // re-select sum, we expect the field to be gone, and the new accumulator to
        // be invalid (not present in the result)
        await setSelectValue(/select accumulator/i, 'sum');

        expect(onChange.lastCall.args[0]).to.equal(
          JSON.stringify({
            _id: null,
          })
        );
      });
    });
  });
});
