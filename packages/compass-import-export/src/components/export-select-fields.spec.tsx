import React from 'react';
import { render, screen } from '@testing-library/react';
import { expect } from 'chai';
import userEvent from '@testing-library/user-event';

import { UnconnectedExportSelectFields as ExportSelectFields } from './export-select-fields';
import { getIdForSchemaPath } from '../modules/export';
import type { FieldsToExport } from '../modules/export';

const retryButtonText = 'Retry';
const addNewFieldButtonId = 'export-add-new-field-button';
const testAddFieldsNumber = 100;

const noop = () => {
  /* noop */
};
function renderExportSelectFields(
  props?: Partial<React.ComponentProps<typeof ExportSelectFields>>
) {
  return render(
    <ExportSelectFields
      isLoading={false}
      errorLoadingFieldsToExport={undefined}
      selectFieldsToExport={noop}
      addFieldToExport={noop}
      toggleFieldToExport={noop}
      toggleExportAllSelectedFields={noop}
      fields={{}}
      {...props}
    />
  );
}

describe('ExportSelectFields [Component]', function () {
  describe('when loading', function () {
    beforeEach(function () {
      renderExportSelectFields({
        isLoading: true,
      });
    });

    it('should render the add new field disabled', function () {
      const addNewField = screen.getByText('Add new field');
      expect(addNewField).to.be.visible;
      expect(screen.getByTestId(addNewFieldButtonId)).to.have.attribute(
        'disabled'
      );
    });
  });

  describe('when there is an error', function () {
    beforeEach(function () {
      renderExportSelectFields({
        isLoading: false,
        errorLoadingFieldsToExport: 'pineapple',
      });
    });

    it('should render the error', function () {
      expect(screen.getByText('Unable to load fields to export: pineapple')).to
        .be.visible;
    });

    it('should render the retry button', function () {
      expect(screen.getByText(retryButtonText)).to.be.visible;
    });
  });

  describe('when rendered with fields loaded', function () {
    beforeEach(function () {
      renderExportSelectFields({
        isLoading: false,
        fields: {
          [getIdForSchemaPath(['name'])]: {
            path: ['name'],
            selected: false,
          },
          [getIdForSchemaPath(['name', 'inner'])]: {
            path: ['name', 'inner'],
            selected: true,
          },
          [getIdForSchemaPath(['test5'])]: {
            path: ['test5'],
            selected: true,
          },
          [getIdForSchemaPath(['test5', 'two'])]: {
            path: ['test5', 'two'],
            selected: false,
          },
        },
      });
    });

    it('should render the field name', function () {
      expect(screen.getByText('name')).to.be.visible;
    });

    it('should render the add new field enabled', function () {
      const addNewField = screen.getByText('Add new field');
      expect(addNewField).to.be.visible;
      expect(screen.getByTestId(addNewFieldButtonId)).to.not.have.attribute(
        'disabled'
      );
    });

    it('should not render the retry button', function () {
      expect(screen.queryByText(retryButtonText)).to.not.exist;
    });

    it('should not render a nested field when its parent is selected', function () {
      expect(screen.queryByText('test5.two')).to.not.exist;
    });

    it('should render a nested field when its parent is not selected', function () {
      expect(screen.getByText('name.inner')).to.be.visible;
    });

    it('should not render the show more fields button when no more fields to show', function () {
      expect(screen.queryByText(`Show ${testAddFieldsNumber} more fields`)).to
        .not.exist;
    });
  });

  describe('with 100+ documents', function () {
    beforeEach(function () {
      const countFieldsToRender = 220;
      const fields: FieldsToExport = {};
      for (let i = 0; i < countFieldsToRender; i++) {
        fields[getIdForSchemaPath([`field-${i}`])] = {
          path: [`field-${i}`],
          selected: false,
        };
      }

      renderExportSelectFields({
        isLoading: false,
        fields,
      });
    });

    it('should render the show more fields button', function () {
      expect(screen.getByText(`Show ${testAddFieldsNumber} more fields`)).to.be
        .visible;
    });

    it('should allow showing more fields', function () {
      expect(
        screen
          .getByTestId('export-fields-table-container')
          .textContent?.match(/field-/g)?.length
      ).to.equal(100);

      userEvent.click(screen.getByTestId('show-more-fields-export-button'));
      expect(
        screen
          .getByTestId('export-fields-table-container')
          .textContent?.match(/field-/g)?.length
      ).to.equal(200);

      userEvent.click(screen.getByTestId('show-more-fields-export-button'));
      expect(
        screen
          .getByTestId('export-fields-table-container')
          .textContent?.match(/field-/g)?.length
      ).to.equal(220);

      expect(screen.queryByText(`Show ${testAddFieldsNumber} more fields`)).to
        .not.exist;
      expect(screen.queryByTestId('show-more-fields-export-button')).to.not
        .exist;
    });
  });
});
