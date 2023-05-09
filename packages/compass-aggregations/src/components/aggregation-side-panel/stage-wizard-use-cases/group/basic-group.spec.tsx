import React from 'react';
import { render, screen } from '@testing-library/react';
import { expect } from 'chai';
import { BasicGroup } from './basic-group';
import sinon from 'sinon';
import { setMultiSelectComboboxValues } from '../../../../../test/form-helper';
import { MULTI_SELECT_LABEL } from '../field-combobox';

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
          name: new RegExp(MULTI_SELECT_LABEL, 'i'),
        })
      ).to.exist;
    });
  });

  it('calls onChange when form fields change', function () {
    const onChange = sinon.spy();
    render(
      <BasicGroup
        onChange={onChange}
        fields={[
          { name: 'a', type: 'String' },
          { name: 'b', type: 'String' },
          { name: 'c', type: 'String' },
        ]}
      />
    );

    setMultiSelectComboboxValues(new RegExp(MULTI_SELECT_LABEL, 'i'), [
      'a',
      'b',
      'c',
    ]);

    expect(onChange.lastCall.args[0]).to.equal(
      JSON.stringify({
        _id: {
          a: '$a',
          b: '$b',
          c: '$c',
        },
      })
    );
    expect(onChange.lastCall.args[1]).to.be.null;

    // deselect a
    setMultiSelectComboboxValues(new RegExp(MULTI_SELECT_LABEL, 'i'), ['a']);
    expect(onChange.lastCall.args[0]).to.equal(
      JSON.stringify({
        _id: {
          b: '$b',
          c: '$c',
        },
      })
    );
    expect(onChange.lastCall.args[1]).to.be.null;

    // deselect b
    setMultiSelectComboboxValues(new RegExp(MULTI_SELECT_LABEL, 'i'), ['b']);
    expect(onChange.lastCall.args[0]).to.equal(
      JSON.stringify({
        _id: '$c',
      })
    );
    expect(onChange.lastCall.args[1]).to.be.null;

    // deselect c
    setMultiSelectComboboxValues(new RegExp(MULTI_SELECT_LABEL, 'i'), ['c']);
    expect(onChange.lastCall.args[0]).to.equal(JSON.stringify({ _id: null }));
    expect(onChange.lastCall.args[1]).to.be.an.instanceOf(Error);
  });
});
