import React from 'react';
import HadronDocument from 'hadron-document';
import { expect } from 'chai';
import sinon from 'sinon';
import {
  render,
  cleanup,
  screen,
  waitFor,
} from '@mongodb-js/testing-library-compass';

import DocumentTableView from './document-table-view';
import type { DocumentTableViewProps } from './document-table-view';
import type { CrudStore } from '../../stores/crud-store';

function getProps(
  props: Partial<DocumentTableViewProps> = {}
): DocumentTableViewProps {
  const docs = [{ _id: '6909a21e9e548506e786c1e5', name: 'test-1' }];

  return {
    addColumn: sinon.spy(),
    cleanCols: sinon.spy(),
    docs: docs.map((doc) => new HadronDocument(doc)),
    drillDown: sinon.spy(),
    elementAdded: sinon.spy(),
    elementMarkRemoved: sinon.spy(),
    elementRemoved: sinon.spy(),
    elementTypeChanged: sinon.spy(),
    error: null,
    isEditable: true,
    ns: 'database.collection',
    version: '4.0.0',
    pathChanged: sinon.spy(),
    removeColumn: sinon.spy(),
    copyToClipboard: sinon.spy(),
    renameColumn: sinon.spy(),
    replaceDoc: sinon.spy(),
    resetColumns: sinon.spy(),
    removeDocument: sinon.spy(),
    replaceDocument: sinon.spy(),
    updateDocument: sinon.spy(),
    start: 1,
    store: {
      gridStore: { listen: sinon.spy() },
    } as unknown as CrudStore,
    table: {
      doc: null,
      editParams: null,
      path: [],
      types: [],
    },
    tz: 'UTC',
    columnWidths: {},
    onColumnWidthChange: sinon.spy(),
    ...props,
  };
}

describe('<DocumentTableView />', function () {
  afterEach(cleanup);

  describe('#render', function () {
    context('when the documents have objects for ids', function () {
      it('renders the document table view with AG-Grid', async function () {
        render(
          <DocumentTableView {...getProps({ columnWidths: { name: 1337 } })} />
        );

        // The AG-Grid wrapper should be rendered
        expect(document.querySelector('.ag-root-wrapper')).to.exist;

        // Wait for AG-Grid to fully render and display the data
        await waitFor(() => {
          // Check that the grid body is present
          expect(document.querySelector('.ag-body-viewport')).to.exist;
        });

        // Validate that the columnWidths prop was applied:
        // - the 'name' column should have the configured width
        // - the '_id' column should not share that explicit width (keeps default)
        const nameHeader = document.querySelector(
          '.ag-header-cell[col-id="name"]'
        ) as HTMLElement | null;
        const idHeader = document.querySelector(
          '.ag-header-cell[col-id="_id"]'
        ) as HTMLElement | null;
        expect(nameHeader, 'name column header should exist').to.exist;
        expect(idHeader, '_id column header should exist').to.exist;
        if (nameHeader) {
          expect(nameHeader.style.width).to.equal('1337px');
        }
        if (idHeader) {
          expect(idHeader.style.width).to.not.equal('1337px');
        }
      });

      it('renders the breadcrumb component', function () {
        render(<DocumentTableView {...getProps()} />);

        // The breadcrumb should show the collection name
        expect(screen.getByText('collection')).to.exist;
      });
    });
  });
});
