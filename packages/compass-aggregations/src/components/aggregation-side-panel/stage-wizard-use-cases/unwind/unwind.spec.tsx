import React from 'react';
import type { ComponentProps } from 'react';
import UnwindForm from './unwind';
import { render, screen, cleanup } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';
import { setComboboxValue } from '../../../../../test/form-helper';
import type { StageWizardFields } from '..';
import { SINGLE_SELECT_LABEL } from '../field-combobox';

const SAMPLE_FIELDS: StageWizardFields = [
  {
    name: 'name',
    type: 'String',
  },
  {
    name: 'year',
    type: 'String',
  },
  {
    name: 'directors',
    type: 'Array',
  },
];

const renderForm = (props: Partial<ComponentProps<typeof UnwindForm>> = {}) => {
  render(<UnwindForm fields={SAMPLE_FIELDS} onChange={() => {}} {...props} />);
};

describe('unwind', function () {
  afterEach(cleanup);

  it('renders a unwind form', function () {
    renderForm();
    expect(screen.getByTestId('unwind-form-field')).to.exist;
  });

  describe('onChange call', function () {
    it('calls the props.onChange with a project stage', function () {
      const onChangeSpy = sinon.spy();
      renderForm({ onChange: onChangeSpy });
      setComboboxValue(new RegExp(SINGLE_SELECT_LABEL, 'i'), 'directors');

      expect(onChangeSpy).to.have.been.calledWithExactly(
        JSON.stringify({ path: '$directors' }),
        null
      );
    });
  });
});
