import React from 'react';
import { render, screen } from '@testing-library/react';
import { expect } from 'chai';
import { ObjectId } from 'bson';

import { UnconnectedExportCodeView as ExportCodeView } from './export-code-view';

const projectionBannerText =
  'Only projected fields will be exported. To export all fields, go back and leave the PROJECT field empty.';

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
      expect(screen.getByTestId('export-code-view-code')).to.be.visible;
      const codeText = screen.getByTestId('export-code-view-code').textContent;
      expect(codeText).to.include('db.getCollection("zebra").find(');
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
            fieldPath: ['name'],
            selected: true,
          },
          test: {
            fieldPath: ['test'],
            selected: false,
          },
        },
      });
    });

    it('should render the projection using the fields', function () {
      expect(screen.getByTestId('export-code-view-code')).to.be.visible;
      const codeText = screen.getByTestId('export-code-view-code').textContent;
      expect(codeText).to.include('name: true');
      expect(codeText).to.not.include('test: true');
    });
  });

  describe('when rendered with a projection', function () {
    beforeEach(function () {
      renderExportCodeView({
        selectedFieldOption: undefined,
        query: {
          filter: {},
          projection: {
            name: 'pineapple',
          },
        },
      });
    });

    it('should render the projection banner', function () {
      expect(screen.queryByText(projectionBannerText)).to.be.visible;
    });
  });

  describe('when rendered without a projection', function () {
    beforeEach(function () {
      renderExportCodeView({
        selectedFieldOption: undefined,
        query: {
          filter: {},
        },
      });
    });

    it('should not render the projection banner', function () {
      expect(screen.queryByText(projectionBannerText)).to.not.exist;
    });
  });

  describe('when rendered with a projection, and a selected field option', function () {
    beforeEach(function () {
      renderExportCodeView({
        selectedFieldOption: 'select-fields',
        query: {
          filter: {},
          projection: {
            name: 'pineapple',
          },
        },
      });
    });

    it('should not render the projection banner', function () {
      expect(screen.queryByText(projectionBannerText)).to.not.exist;
    });
  });
});
