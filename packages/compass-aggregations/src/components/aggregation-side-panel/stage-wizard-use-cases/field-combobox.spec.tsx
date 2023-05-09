import React from 'react';
import type { ComponentProps } from 'react';
import {
  FieldCombobox,
  getParentPaths,
  isOptionDisabled,
} from './field-combobox';
import { render, screen } from '@testing-library/react';
import { expect } from 'chai';
import { setInputElementValue } from '../../../../test/form-helper';
import type { StageWizardFields } from '.';

const SAMPLE_FIELDS: StageWizardFields = [
  {
    name: '_id',
    type: 'ObjectId',
  },
  {
    name: 'address',
    type: 'String',
  },
  {
    name: 'address.city',
    type: 'String',
  },
  {
    name: 'address.zip',
    type: 'Int32',
  },
];

const renderFieldCombobox = (
  props: Partial<ComponentProps<typeof FieldCombobox>> = {}
) => {
  render(<FieldCombobox fields={SAMPLE_FIELDS} {...props} />);
};
describe('field-combobox', function () {
  context('component', function () {
    it('does not render custom field label for available options', function () {
      renderFieldCombobox();
      setInputElementValue(/select a field/i, '_id');
      const option = screen.getByRole('option', { name: '_id' });
      expect(option).to.exist;
    });
    it('renders custom field label for unavailable options', function () {
      renderFieldCombobox();
      setInputElementValue(/select a field/i, 'email');
      const option = screen.getByRole('option', { name: /field: "email"/i });
      expect(option).to.exist;
    });
  });
  context('helpers', function () {
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
        options.forEach((option) => {
          expect(isOptionDisabled([], option)).to.be.false;
        });
      });

      it('should return false when projected fields do not include any nested field', function () {
        options.forEach((option) => {
          expect(isOptionDisabled(['_id', 'name', 'stars', 'cusine'], option))
            .to.be.false;
        });
      });

      context(
        'when there is a nested children in projected field',
        function () {
          it('should return true for its parent and the children of the projected nested children and false for rest', function () {
            // Check with a nested-nested property
            expect(isOptionDisabled(['address.nested'], '_id')).to.be.false;
            // Since a children is already projected the parent cannot be
            expect(isOptionDisabled(['address.nested'], 'address')).to.be.true;
            expect(isOptionDisabled(['address.nested'], 'address.city')).to.be
              .false;
            expect(isOptionDisabled(['address.nested'], 'address.state')).to.be
              .false;
            expect(isOptionDisabled(['address.nested'], 'address.street')).to.be
              .false;
            expect(isOptionDisabled(['address.nested'], 'address.zipcode')).to
              .be.false;
            expect(isOptionDisabled(['address.nested'], 'address.nested')).to.be
              .false;
            // Since the parent of the following paths is already projected hence children cannot be
            expect(
              isOptionDisabled(['address.nested'], 'address.nested.cityname')
            ).to.be.true;
            expect(
              isOptionDisabled(['address.nested'], 'address.nested.countryname')
            ).to.be.true;
            expect(isOptionDisabled(['address.nested'], 'cusine')).to.be.false;
            expect(isOptionDisabled(['address.nested'], 'name')).to.be.false;
            expect(isOptionDisabled(['address.nested'], 'stars')).to.be.false;

            // This time check with a simple nested property
            expect(isOptionDisabled(['address.city'], '_id')).to.be.false;
            // Since a children is already projected the parent cannot be
            expect(isOptionDisabled(['address.city'], 'address')).to.be.true;
            expect(isOptionDisabled(['address.city'], 'address.city')).to.be
              .false;
            expect(isOptionDisabled(['address.city'], 'address.state')).to.be
              .false;
            expect(isOptionDisabled(['address.city'], 'address.street')).to.be
              .false;
            expect(isOptionDisabled(['address.city'], 'address.zipcode')).to.be
              .false;
            expect(isOptionDisabled(['address.city'], 'address.nested')).to.be
              .false;
            expect(
              isOptionDisabled(['address.city'], 'address.nested.cityname')
            ).to.be.false;
            expect(
              isOptionDisabled(['address.city'], 'address.nested.countryname')
            ).to.be.false;
            expect(isOptionDisabled(['address.city'], 'cusine')).to.be.false;
            expect(isOptionDisabled(['address.city'], 'name')).to.be.false;
            expect(isOptionDisabled(['address.city'], 'stars')).to.be.false;
          });
        }
      );
    });
  });
});
