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
import { GridStoreContext } from '../../stores/grid-store-context';
import type { GridStore } from '../../stores/grid-store';

function renderDocumentTableView({
  columnWidths = {},
  gridStore = { listen: sinon.stub().returns(sinon.spy()) },
}: {
  columnWidths?: Record<string, number>;
  gridStore?: Pick<GridStore, 'listen'>;
} = {}) {
  const docs = [{ _id: '6909a21e9e548506e786c1e5', name: 'test-1' }];
  const hadronDocs = docs.map((doc) => new HadronDocument(doc));

  render(
    <GridStoreContext.Provider value={gridStore as GridStore}>
      <DocumentTableView
        docs={hadronDocs}
        ns={'database.collection'}
        version={'6.0.0'}
        error={null}
        isEditable={true}
        pathChanged={sinon.spy()}
        table={{
          doc: null,
          editParams: null,
          path: [],
          types: [],
        }}
        addColumn={sinon.spy()}
        removeColumn={sinon.spy()}
        renameColumn={sinon.spy()}
        cleanCols={sinon.spy()}
        drillDown={sinon.spy()}
        elementAdded={sinon.spy()}
        elementMarkRemoved={sinon.spy()}
        elementRemoved={sinon.spy()}
        elementTypeChanged={sinon.spy()}
        copyToClipboard={sinon.spy()}
        replaceDoc={sinon.spy()}
        removeDocument={sinon.stub().resolves()}
        replaceDocument={sinon.stub().resolves()}
        updateDocument={sinon.stub().resolves()}
        resetColumns={sinon.spy()}
        columnWidths={columnWidths}
        onColumnWidthChange={sinon.spy()}
        start={1}
      />
    </GridStoreContext.Provider>
  );
}

describe('<DocumentTableView />', function () {
  afterEach(cleanup);

  describe('#render', function () {
    context('when the documents have objects for ids', function () {
      it('renders the document table view with AG-Grid', async function () {
        const gridStore = { listen: sinon.stub().returns(sinon.spy()) };
        renderDocumentTableView({
          columnWidths: { name: 1337 },
          gridStore,
        });

        // The AG-Grid wrapper should be rendered
        expect(document.querySelector('.ag-root-wrapper')).to.exist;

        // The component should subscribe to the grid store from context
        expect(gridStore.listen).to.have.been.calledOnce;

        // Wait for AG-Grid to fully render and display the data
        await waitFor(() => {
          // Check that the grid body is present
          expect(document.querySelector('.ag-body-viewport')).to.exist;
        });

        // Validate that the columnWidths prop was applied:
        // - the 'name' column should have the configured width
        // - the '_id' column should not share that explicit width (keeps default)
        const nameHeader = document.querySelector<HTMLElement>(
          '.ag-header-cell[col-id="name"]'
        );
        const idHeader = document.querySelector<HTMLElement>(
          '.ag-header-cell[col-id="_id"]'
        );
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
        renderDocumentTableView();

        // The breadcrumb should show the collection name
        expect(screen.getByText('collection')).to.exist;
      });
    });
  });
});
