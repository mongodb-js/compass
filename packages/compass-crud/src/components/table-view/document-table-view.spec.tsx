import React from 'react';
import { mount } from 'enzyme';
import type { ReactWrapper } from 'enzyme';
import HadronDocument from 'hadron-document';
import { expect } from 'chai';
import sinon from 'sinon';

import DocumentTableView, {
  DocumentTableView as RawDocumentTableView,
} from './document-table-view';

describe('<DocumentTableView />', function () {
  describe('#render', function () {
    context('when the documents have objects for ids', function () {
      const docs = [{ _id: '6909a21e9e548506e786c1e5', name: 'test-1' }];
      const hadronDocs = docs.map((doc) => new HadronDocument(doc));

      let component: ReactWrapper;
      beforeEach(function () {
        component = mount(
          <DocumentTableView
            docs={hadronDocs}
            ns={'database.collection'}
            namespace={'database.collection'}
            pathChanged={sinon.spy()}
            table={{
              doc: null,
              editParams: null,
              path: [],
              types: [],
            }}
            store={{
              gridStore: {
                listen: sinon.spy(),
              },
            }}
            resetColumns={sinon.spy()}
            tableData={{
              columnWidths: {
                name: 1337,
              },
            }}
            start={1}
          />
        );
      });

      afterEach(function () {
        component?.unmount();
      });

      it('columnWidths data gets applied to relevant grid column', async function () {
        // Ensure we wait for GridReadyEvent so columnApi is set
        await new Promise(setImmediate);

        const instance = component.find(RawDocumentTableView).instance();
        expect(instance).to.not.be.undefined;

        const columnState = instance.columnApi.getColumnState();
        const nameCol = columnState.find((column) => column.colId === 'name');
        const idCol = columnState.find((column) => column.colId === '_id');

        expect(nameCol.width).to.equal(1337);
        expect(idCol.width).to.equal(200); // Default width is 200
      });
    });
  });
});
