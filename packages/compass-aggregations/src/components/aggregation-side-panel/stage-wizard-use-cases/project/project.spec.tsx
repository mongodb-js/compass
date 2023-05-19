import React from 'react';
import type { ComponentProps } from 'react';
import ProjectForm, { mapProjectFormStateToStageValue } from './project';
import type { ProjectionType } from './project';
import { render, screen, within, cleanup } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';
import {
  setSelectValue,
  setMultiSelectComboboxValues,
} from '../../../../../test/form-helper';
import type { StageWizardFields } from '..';
import { MULTI_SELECT_LABEL } from '../field-combobox';

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

const renderForm = (
  props: Partial<ComponentProps<typeof ProjectForm>> = {}
) => {
  render(<ProjectForm fields={SAMPLE_FIELDS} onChange={() => {}} {...props} />);
};

describe('project', function () {
  afterEach(cleanup);

  it('renders a project form', function () {
    renderForm();
    expect(screen.getByTestId('project-form-projection')).to.exist;
    expect(screen.getByTestId('project-form-field')).to.exist;
  });

  it('correctly changes the projection type', function () {
    renderForm();

    setSelectValue(/select projection type/i, 'exclude');
    expect(
      within(screen.getByTestId('project-form-projection')).getByText(
        /exclude/i
      )
    ).to.exist;

    setSelectValue(/select projection type/i, 'include');
    expect(
      within(screen.getByTestId('project-form-projection')).getByText(
        /include/i
      )
    ).to.exist;
  });

  it('correctly selects a field from the combobox of fields', function () {
    renderForm();

    setMultiSelectComboboxValues(new RegExp(MULTI_SELECT_LABEL, 'i'), [
      'street',
      'city',
    ]);
    const selectedOptions = within(
      screen.getByTestId('project-form-field')
    ).getAllByRole('option');

    expect(selectedOptions).to.have.lengthOf(2);
    expect(within(selectedOptions[0]).getByText(/street/i)).to.exist;
    expect(within(selectedOptions[1]).getByText(/city/i)).to.exist;
  });

  describe('onChange call', function () {
    const projectionTypes: Array<ProjectionType> = ['include', 'exclude'];

    projectionTypes.forEach((projectionType) => {
      context(`when projection type is ${projectionType}`, function () {
        it('calls the props.onChange with form state converted to a project stage', function () {
          const onChangeSpy = sinon.spy();
          const op = projectionType === 'exclude' ? 0 : 1;
          renderForm({ onChange: onChangeSpy });
          setSelectValue(/select projection type/i, projectionType);

          setMultiSelectComboboxValues(new RegExp(MULTI_SELECT_LABEL, 'i'), [
            'street',
          ]);
          expect(onChangeSpy).to.have.been.calledWithExactly(
            JSON.stringify({ street: op }),
            null
          );

          // Since we selected street above, this time it will deselect it
          setMultiSelectComboboxValues(new RegExp(MULTI_SELECT_LABEL, 'i'), [
            'street',
            'city',
          ]);
          expect(onChangeSpy.lastCall).to.have.been.calledWithExactly(
            JSON.stringify({ city: op }),
            null
          );

          // Here we select all three
          setMultiSelectComboboxValues(new RegExp(MULTI_SELECT_LABEL, 'i'), [
            'street',
            'zip',
          ]);
          expect(onChangeSpy.lastCall).to.have.been.calledWithExactly(
            JSON.stringify({ city: op, street: op, zip: op }),
            null
          );
        });

        it('calls the props.onChange with error if there was an error', function () {
          const onChangeSpy = sinon.spy();
          renderForm({ onChange: onChangeSpy });
          // Creating a scenario where form ends up empty

          setMultiSelectComboboxValues(new RegExp(MULTI_SELECT_LABEL, 'i'), [
            'street',
            'city',
          ]);
          setMultiSelectComboboxValues(new RegExp(MULTI_SELECT_LABEL, 'i'), [
            'street',
            'city',
          ]);

          expect(onChangeSpy.lastCall.args[0]).to.equal(JSON.stringify({}));

          expect(onChangeSpy.lastCall.args[1].message).to.equal(
            'No field selected'
          );
        });
      });
    });
  });

  describe('mapProjectFormStateToStageValue', function () {
    const variants: Array<ProjectionType> = ['include', 'exclude'];
    variants.forEach(function (variant) {
      context(`when variant is ${variant}`, function () {
        it('should return correct project stage for provided form state', function () {
          const op = variant === 'exclude' ? 0 : 1;
          expect(
            mapProjectFormStateToStageValue({
              projectionType: variant,
              projectionFields: [],
            })
          ).to.deep.equal({});

          expect(
            mapProjectFormStateToStageValue({
              projectionType: variant,
              projectionFields: ['field1', 'field2'],
            })
          ).to.deep.equal({ field1: op, field2: op });

          expect(
            mapProjectFormStateToStageValue({
              projectionType: variant,
              projectionFields: ['field1', 'field2', 'field1'],
            })
          ).to.deep.equal({ field1: op, field2: op });
        });
      });
    });
  });
});
