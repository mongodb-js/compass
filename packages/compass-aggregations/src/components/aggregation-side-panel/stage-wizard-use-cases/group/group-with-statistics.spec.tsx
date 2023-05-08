import React from 'react';
import { render, screen } from '@testing-library/react';
import { expect } from 'chai';
import { GroupWithStatistics } from './group-with-statistics';
import sinon from 'sinon';
import {
  setMultiSelectComboboxValues,
  setComboboxValue,
  setSelectValue,
} from '../../../../../test/form-helper';
import type { StageWizardFields } from '..';

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
          name: /select a field name/i,
        })
      ).to.exist;
    });
    it('renders group fields combobox', function () {
      expect(
        screen.getByRole('textbox', {
          name: /select field names/i,
        })
      ).to.exist;
    });
    it('renders accumulator add/remove buttons', function () {
      screen
        .getByRole('button', {
          name: /add/i,
        })
        .click();

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
    it('when selecting group fields', function () {
      setMultiSelectComboboxValues(/select field names/i, ['name', 'street']);
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
      it('when selecting only type', function () {
        setSelectValue(/select accumulator/i, 'sum');
        expect(onChange.lastCall.args[0]).to.equal(
          JSON.stringify({
            _id: null,
          })
        );
        expect(onChange.lastCall.args[1]).to.not.be.null;
      });
      it('when selecting only field', function () {
        setComboboxValue(/select a field name/i, 'orders');
        expect(onChange.lastCall.args[0]).to.equal(
          JSON.stringify({
            _id: null,
          })
        );
        expect(onChange.lastCall.args[1]).to.not.be.null;
      });
      it('when selecting both - field and type', function () {
        setSelectValue(/select accumulator/i, 'sum');
        setComboboxValue(/select a field name/i, 'orders');
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
  });
});
