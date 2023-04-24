import React from 'react';
import type { ComponentProps } from 'react';
import ProjectForm, {
  mapProjectFormStateToStageValue,
  COMBOBOX_PLACEHOLDER_TEXT,
  getParentPaths,
  makeIsOptionDisabled,
} from './project';
import type { ProjectionType } from './project';
import {
  render,
  screen,
  within,
  cleanup,
  fireEvent,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'chai';
import sinon from 'sinon';

const renderForm = (
  props: Partial<ComponentProps<typeof ProjectForm>> = {}
) => {
  render(
    <ProjectForm
      fields={['street', 'city', 'zip']}
      onChange={() => {}}
      {...props}
    />
  );
};

const selectProjection = (value: ProjectionType) => {
  const selectBox = screen.getByTestId('project-form-projection');
  userEvent.click(selectBox);

  const selectAriaLabelledBy = selectBox.getAttribute('aria-labelledby');
  const option = within(
    document.querySelector(
      `ul[role="listbox"][aria-labelledby="${selectAriaLabelledBy}"]`
    )!
  ).getByText(new RegExp(value, 'i'));

  userEvent.click(option, undefined, { skipPointerEventsCheck: true });
};

const selectFields = (fields: string[]) => {
  const comboboxField = within(
    screen.getByTestId('project-form-field')
  ).getByRole('textbox', {
    name: new RegExp(COMBOBOX_PLACEHOLDER_TEXT, 'i'),
  });
  userEvent.click(comboboxField);

  const comboboxOptionSelector = `.project-form-field-combobox`;
  fields.forEach((field) => {
    userEvent.click(
      within(document.querySelector(comboboxOptionSelector)!).getByText(
        new RegExp(`^${field}$`, 'i')
      ),
      undefined,
      {
        skipPointerEventsCheck: true,
      }
    );
  });
  fireEvent(
    document.querySelector(comboboxOptionSelector)!,
    new MouseEvent('blur')
  );
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

    selectProjection('exclude');
    expect(
      within(screen.getByTestId('project-form-projection')).getByText(
        /exclude/i
      )
    ).to.exist;

    selectProjection('include');
    expect(
      within(screen.getByTestId('project-form-projection')).getByText(
        /include/i
      )
    ).to.exist;
  });

  it('correctly selects a field from the combobox of fields', function () {
    renderForm();

    selectFields(['street', 'city']);
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
          selectProjection(projectionType);

          selectFields(['street']);
          expect(onChangeSpy).to.have.been.calledWithExactly(
            JSON.stringify({ street: op }),
            null
          );

          // Since we selected street above, this time it will deselect it
          selectFields(['street', 'city']);
          expect(onChangeSpy.lastCall).to.have.been.calledWithExactly(
            JSON.stringify({ city: op }),
            null
          );

          // Here we select all three
          selectFields(['street', 'zip']);
          expect(onChangeSpy.lastCall).to.have.been.calledWithExactly(
            JSON.stringify({ city: op, street: op, zip: op }),
            null
          );
        });

        it('calls the props.onChange with error if there was an error', function () {
          const onChangeSpy = sinon.spy();
          renderForm({ onChange: onChangeSpy });
          // Creating a scenario where form ends up empty

          selectFields(['street', 'city']);
          selectFields(['street', 'city']);

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
          expect(mapProjectFormStateToStageValue(variant, [])).to.deep.equal(
            {}
          );

          expect(
            mapProjectFormStateToStageValue(variant, ['field1', 'field2'])
          ).to.deep.equal({ field1: op, field2: op });

          expect(
            mapProjectFormStateToStageValue(variant, [
              'field1',
              'field2',
              'field1',
            ])
          ).to.deep.equal({ field1: op, field2: op });
        });
      });
    });
  });

  describe('getParentPaths', function () {
    it('should return possible parent paths for provided list of paths', function () {
      expect(getParentPaths([])).to.deep.equal([]);
      expect(getParentPaths(['address'])).to.deep.equal(['address']);
      expect(getParentPaths(['address'], ['address'])).to.deep.equal([]);

      expect(getParentPaths(['address', 'city'])).to.deep.equal([
        'address',
        'address.city',
      ]);
      expect(getParentPaths(['address', 'city'], ['address'])).to.deep.equal([
        'address.city',
      ]);

      expect(getParentPaths(['address', 'country', 'city'])).to.deep.equal([
        'address',
        'address.country',
        'address.country.city',
      ]);
      expect(
        getParentPaths(
          ['address', 'country', 'city'],
          ['address', 'address.country']
        )
      ).to.deep.equal(['address.country.city']);
      expect(
        getParentPaths(['address', 'country', 'city'], ['address.country'])
      ).to.deep.equal(['address', 'address.country.city']);
    });
  });

  describe('isOptionDisabled', function () {
    const options = [
      '_id',
      'address',
      'address.city',
      'address.state',
      'address.street',
      'address.zipcode',
      'address.nested',
      'address.nested.cityname',
      'address.nested.countryname',
      'cusine',
      'name',
      'stars',
    ];

    it('should return false for options when there is nothing in projectedfields', function () {
      const isOptionDisabled = makeIsOptionDisabled([]);
      options.forEach((option) => {
        expect(isOptionDisabled(option)).to.be.false;
      });
    });

    it('should return false when projected fields do not include any nested field', function () {
      const isOptionDisabled = makeIsOptionDisabled([
        '_id',
        'name',
        'stars',
        'cusine',
      ]);
      options.forEach((option) => {
        expect(isOptionDisabled(option)).to.be.false;
      });
    });

    context('when there is a nested children in projected field', function () {
      it('should return true for its parent and the children of the projected nested children and false for rest', function () {
        // Check with a nested-nested property
        let isOptionDisabled = makeIsOptionDisabled(['address.nested']);
        expect(isOptionDisabled('_id')).to.be.false;
        // Since a children is already projected the parent cannot be
        expect(isOptionDisabled('address')).to.be.true;
        expect(isOptionDisabled('address.city')).to.be.false;
        expect(isOptionDisabled('address.state')).to.be.false;
        expect(isOptionDisabled('address.street')).to.be.false;
        expect(isOptionDisabled('address.zipcode')).to.be.false;
        expect(isOptionDisabled('address.nested')).to.be.false;
        // Since the parent of the following paths is already projected hence children cannot be
        expect(isOptionDisabled('address.nested.cityname')).to.be.true;
        expect(isOptionDisabled('address.nested.countryname')).to.be.true;
        expect(isOptionDisabled('cusine')).to.be.false;
        expect(isOptionDisabled('name')).to.be.false;
        expect(isOptionDisabled('stars')).to.be.false;

        // This time check with a simple nested property
        isOptionDisabled = makeIsOptionDisabled(['address.city']);
        expect(isOptionDisabled('_id')).to.be.false;
        // Since a children is already projected the parent cannot be
        expect(isOptionDisabled('address')).to.be.true;
        expect(isOptionDisabled('address.city')).to.be.false;
        expect(isOptionDisabled('address.state')).to.be.false;
        expect(isOptionDisabled('address.street')).to.be.false;
        expect(isOptionDisabled('address.zipcode')).to.be.false;
        expect(isOptionDisabled('address.nested')).to.be.false;
        expect(isOptionDisabled('address.nested.cityname')).to.be.false;
        expect(isOptionDisabled('address.nested.countryname')).to.be.false;
        expect(isOptionDisabled('cusine')).to.be.false;
        expect(isOptionDisabled('name')).to.be.false;
        expect(isOptionDisabled('stars')).to.be.false;
      });
    });
  });
});
