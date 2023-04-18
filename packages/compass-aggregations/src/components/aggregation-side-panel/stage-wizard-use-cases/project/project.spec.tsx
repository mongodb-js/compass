import React from 'react';
import type { ComponentProps } from 'react';
import {
  ProjectForm,
  mapProjectFormStateToStageValue,
  COMBOBOX_PLACEHOLDER_TEXT,
} from './project';
import type { HOCProps } from './project';
import { render, screen, within, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'chai';
import sinon from 'sinon';

const renderForm = (
  props: Partial<ComponentProps<typeof ProjectForm>> = {}
) => {
  render(
    <ProjectForm
      variant={props.variant || 'include'}
      fields={['street', 'city', 'zip']}
      onChange={() => {}}
      {...props}
    />
  );
};

const setFieldValue = (
  value: string,
  variant: 'include' | 'exclude',
  formRowIndex: number
) => {
  const formRowTestId = `project-${variant}-form-${formRowIndex}`;
  const comboboxField = within(screen.getByTestId(formRowTestId)).getByRole(
    'textbox',
    {
      name: new RegExp(COMBOBOX_PLACEHOLDER_TEXT, 'i'),
    }
  );
  userEvent.click(comboboxField);

  const comboboxOptionSelector = `.project-${variant}-form-${formRowIndex}-field-combobox`;
  userEvent.click(
    within(document.querySelector(comboboxOptionSelector)!).getByText(
      new RegExp(value, 'i')
    ),
    undefined,
    {
      skipPointerEventsCheck: true,
    }
  );
};

const addRow = (after: number, variant: 'include' | 'exclude') => {
  const addBtnContainerRowTestId = `project-${variant}-form-${after}`;
  userEvent.click(
    within(screen.getByTestId(addBtnContainerRowTestId)).getByRole('button', {
      name: /add/i,
    })
  );
};

const removeRow = (at: number, variant: 'include' | 'exclude') => {
  const removeBtnContainerRowTestId = `project-${variant}-form-${at}`;
  userEvent.click(
    within(screen.getByTestId(removeBtnContainerRowTestId)).getByRole(
      'button',
      {
        name: /remove/i,
      }
    )
  );
};

describe('project', function () {
  afterEach(cleanup);

  it('renders a project form for include, when variant is include', function () {
    renderForm({ variant: 'include' });
    expect(screen.getByText(/include/i)).to.exist;
    expect(
      screen.getByRole('button', {
        name: /add/i,
      })
    ).to.exist;
    expect(
      screen.queryByRole('button', {
        name: /remove/i,
      })
    ).to.not.exist;
  });

  it('renders a project form for exclude, when variant is exclude', function () {
    renderForm({ variant: 'exclude' });
    expect(screen.getByText(/exclude/i)).to.exist;
    expect(
      screen.getByRole('button', {
        name: /add/i,
      })
    ).to.exist;
    expect(
      screen.queryByRole('button', {
        name: /remove/i,
      })
    ).to.not.exist;
  });

  it('adds a new project form row when add button is clicked', function () {
    renderForm({ variant: 'include' });
    addRow(0, 'include');

    const formRows = screen.getAllByTestId(/project-include-form-\d+$/);
    expect(formRows).to.have.lengthOf(2);
  });

  it('removes a project form row when remove button is clicked', function () {
    renderForm({ variant: 'include' });
    addRow(0, 'include');

    expect(screen.getAllByTestId(/project-include-form-\d+$/)).to.have.lengthOf(
      2
    );

    removeRow(1, 'include');
    expect(screen.getAllByTestId(/project-include-form-\d+$/)).to.have.lengthOf(
      1
    );
  });

  it('renders correct labels and button when there are more than one row', function () {
    renderForm({ variant: 'include' });
    addRow(0, 'include');

    const formRows = screen.getAllByTestId(/project-include-form-\d+$/);
    expect(formRows).to.have.lengthOf(2);

    // The first row contains the variant name and no remove button
    expect(within(formRows[0]).getByText(/include/i)).to.exist;
    expect(
      within(formRows[0]).getByRole('button', {
        name: /add/i,
      })
    ).to.exist;
    expect(
      within(formRows[0]).queryByRole('button', {
        name: /remove/i,
      })
    ).to.not.exist;

    // The second and following rows will contain condition separator and a remove button
    expect(within(formRows[1]).getByText(/and/i)).to.exist;
    expect(
      within(formRows[1]).getByRole('button', {
        name: /add/i,
      })
    ).to.exist;
    expect(
      within(formRows[1]).getByRole('button', {
        name: /remove/i,
      })
    ).to.exist;
  });

  it('correctly selects a field from the combobox of fields', function () {
    renderForm({ variant: 'include' });
    addRow(0, 'include');
    addRow(1, 'include');
    setFieldValue('street', 'include', 0);
    setFieldValue('city', 'include', 1);
    setFieldValue('zip', 'include', 2);

    const formRows = screen.getAllByTestId(/project-include-form-\d+$/);

    expect(
      within(formRows[0])
        .getByRole('textbox', {
          name: new RegExp(COMBOBOX_PLACEHOLDER_TEXT, 'i'),
        })
        .getAttribute('value')
    ).to.equal('street');

    expect(
      within(formRows[1])
        .getByRole('textbox', {
          name: new RegExp(COMBOBOX_PLACEHOLDER_TEXT, 'i'),
        })
        .getAttribute('value')
    ).to.equal('city');

    expect(
      within(formRows[2])
        .getByRole('textbox', {
          name: new RegExp(COMBOBOX_PLACEHOLDER_TEXT, 'i'),
        })
        .getAttribute('value')
    ).to.equal('zip');
  });

  describe('onChange call', function () {
    const variants: Array<HOCProps['variant']> = ['include', 'exclude'];

    variants.forEach((variant) => {
      context(
        `when project form is rendered with variant === ${variant}`,
        function () {
          it('calls the props.onChange with form state converted to a project stage', function () {
            const onChangeSpy = sinon.spy();
            const op = variant === 'exclude' ? 0 : 1;
            renderForm({ variant, onChange: onChangeSpy });
            setFieldValue('street', variant, 0);
            expect(onChangeSpy).to.have.been.calledWithExactly(
              JSON.stringify({ street: op }),
              null
            );

            setFieldValue('city', variant, 0);
            expect(onChangeSpy.lastCall).to.have.been.calledWithExactly(
              JSON.stringify({ city: op }),
              null
            );

            addRow(0, variant);
            expect(onChangeSpy.lastCall).to.have.been.calledWithExactly(
              JSON.stringify({ city: op }),
              null
            );

            setFieldValue('city', variant, 1);
            expect(onChangeSpy.lastCall).to.have.been.calledWithExactly(
              JSON.stringify({ city: op }),
              null
            );

            setFieldValue('zip', variant, 1);
            expect(onChangeSpy.lastCall).to.have.been.calledWithExactly(
              JSON.stringify({
                city: op,
                zip: op,
              }),
              null
            );
          });

          it('calls the props.onChange with error if there was an error', function () {
            const onChangeSpy = sinon.spy();
            renderForm({ variant, onChange: onChangeSpy });
            // Creating a scenario where form ends up empty
            addRow(0, variant);
            setFieldValue('street', variant, 1);
            removeRow(1, variant);

            expect(onChangeSpy.lastCall.args[0]).to.equal(JSON.stringify({}));

            expect(onChangeSpy.lastCall.args[1].message).to.equal(
              'No field selected'
            );
          });
        }
      );
    });
  });

  describe('mapProjectFormStateToStageValue', function () {
    const variants: Array<HOCProps['variant']> = ['include', 'exclude'];
    variants.forEach(function (variant) {
      context(`when variant is ${variant}`, function () {
        it('should return correct project stage for provided form state', function () {
          const op = variant === 'exclude' ? 0 : 1;
          expect(mapProjectFormStateToStageValue(variant, [])).to.deep.equal(
            {}
          );

          expect(
            mapProjectFormStateToStageValue(variant, [null, null])
          ).to.deep.equal({});

          expect(
            mapProjectFormStateToStageValue(variant, ['field1', null, 'field2'])
          ).to.deep.equal({ field1: op, field2: op });

          expect(
            mapProjectFormStateToStageValue(variant, [
              'field1',
              null,
              'field2',
              'field1',
            ])
          ).to.deep.equal({ field1: op, field2: op });
        });
      });
    });
  });
});
