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
          _id: new ObjectId(),
        },
      }}
      fields={{}}
      selectedFieldOption="all-fields"
      {...props}
    />
  );
}

describe('ExportCodeView [Component]', function () {
  describe('when rendered', function () {
    beforeEach(function () {
      renderExportCodeView();
    });

    it('should render the query code', function () {
      expect(screen.getByTestId('export-collection-code-preview-wrapper')).to.be
        .visible;
      const codeText = screen.getByTestId(
        'export-collection-code-preview-wrapper'
      ).textContent;
      expect(codeText).to.include("db.getCollection('zebra').find(");
      expect(screen.queryByText('Export results from the query below')).to.be
        .visible;
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
