import React from 'react';
import { render, screen } from '@testing-library/react';
import { expect } from 'chai';
import { ObjectId } from 'bson';

import { UnconnectedExportCodeView as ExportCodeView } from './export-code-view';

function renderExportCodeView(
  props?: Partial<React.ComponentProps<typeof ExportCodeView>>
) {
  return render(
    <ExportCodeView
      ns="test.zebra"
      query={{
        filter: {
          _id: new ObjectId('123412322123123123123123'),
        },
      }}
      fields={{}}
      selectedFieldOption="all-fields"
      {...props}
    />
  );
}

describe('ExportCodeView [Component]', function () {
  describe('when rendered with a query', function () {
    beforeEach(function () {
      renderExportCodeView();
    });

    it('should render the query code', function () {
      expect(screen.getByTestId('export-collection-code-preview-wrapper')).to.be
        .visible;
      const codeText = screen.getByTestId(
        'export-collection-code-preview-wrapper'
      ).textContent;
      expect(codeText).to.equal(
        `db.getCollection('zebra').find({  _id: ObjectId('123412322123123123123123')});`
      );
      expect(screen.queryByText('Export results from the query below')).to.be
        .visible;
    });
  });

  describe('when rendered with an aggregation', function () {
    beforeEach(function () {
      renderExportCodeView({
        aggregation: {
          stages: [
            {
              $match: { stripes: 'yes' },
            },
          ],
        },
      });
    });

    it('should render the aggregation code', function () {
      expect(screen.getByTestId('export-collection-code-preview-wrapper')).to.be
        .visible;
      const codeText = screen.getByTestId(
        'export-collection-code-preview-wrapper'
      ).textContent;
      expect(codeText).to.equal(
        `db.getCollection('zebra').aggregate([  { $match: { stripes: 'yes' } }]);`
      );
      expect(screen.queryByText('Export results from the aggregation below')).to
        .be.visible;
    });
  });

  describe('when rendered with selected fields', function () {
    beforeEach(function () {
      renderExportCodeView({
        selectedFieldOption: 'select-fields',
        query: {
          filter: {},
        },
        fields: {
          name: {
            path: ['name'],
            selected: true,
          },
          test: {
            path: ['test'],
            selected: false,
          },
        },
      });
    });

    it('should render the projection using the fields', function () {
      expect(screen.getByTestId('export-collection-code-preview-wrapper')).to.be
        .visible;
      const codeText = screen.getByTestId(
        'export-collection-code-preview-wrapper'
      ).textContent;
      expect(codeText).to.include('name: 1');
      expect(codeText).to.not.include('test: 1');
    });
  });
});
