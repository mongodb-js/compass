import React from 'react';
import { expect } from 'chai';
import { ObjectId } from 'bson';
import {
  render,
  screen,
  cleanup,
  userEvent,
  within,
} from '@mongodb-js/testing-library-compass';

import {
  getNode,
  getApi,
  getColumn,
  getActions,
  getColumnApi,
  getContext,
  notCalledExcept,
} from '../../../test/aggrid-helper';

import CellEditor from './cell-editor';

describe('<CellEditor />', function () {
  afterEach(cleanup);

  describe('#render', function () {
    const api = getApi();
    const column = getColumn('field1', {
      headerName: 'field1',
      headerComponentParams: { bsonType: 'String' },
    });
    const actions = getActions();
    const columnApi = getColumnApi([]);
    const context = getContext([]);

    describe('editable element', function () {
      it('renders the input field and type dropdown', function () {
        const rowNode = getNode({ field1: 'value' });
        const value = rowNode.data.hadronDocument.get('field1');
        const { container } = render(
          <CellEditor
            api={api as any}
            column={column as any}
            node={rowNode}
            value={value}
            removeColumn={actions.removeColumn}
            renameColumn={actions.renameColumn}
            elementAdded={actions.elementAdded}
            elementRemoved={actions.elementRemoved}
            elementTypeChanged={actions.elementTypeChanged}
            elementMarkRemoved={actions.elementMarkRemoved}
            drillDown={actions.drillDown}
            addColumn={actions.addColumn}
            tz="UTC"
            columnApi={columnApi as any}
            context={context}
          />
        );
        expect(container.querySelector('.table-view-cell-editor')).to.exist;
        expect(
          container.querySelector('.editable-element-value-wrapper-is-string')
        ).to.exist;
        expect(container.querySelector('.table-view-cell-editor-types')).to
          .exist;
      });

      it('renders the add field and remove field buttons', function () {
        const rowNode = getNode({ field1: 'value' });
        const value = rowNode.data.hadronDocument.get('field1');
        render(
          <CellEditor
            api={api as any}
            column={column as any}
            node={rowNode}
            value={value}
            removeColumn={actions.removeColumn}
            renameColumn={actions.renameColumn}
            elementAdded={actions.elementAdded}
            elementRemoved={actions.elementRemoved}
            elementTypeChanged={actions.elementTypeChanged}
            elementMarkRemoved={actions.elementMarkRemoved}
            drillDown={actions.drillDown}
            addColumn={actions.addColumn}
            tz="UTC"
            columnApi={columnApi as any}
            context={context}
          />
        );
        // Add field button exists
        expect(screen.getByTestId('table-view-cell-editor-add-field-button')).to
          .exist;
        // Remove field button exists
        expect(screen.getByTestId('table-view-cell-editor-remove-field-button'))
          .to.exist;
        // Does not render field name input or expand button for simple element
        expect(screen.queryByTestId('table-view-cell-editor-fieldname-input'))
          .to.not.exist;
        expect(screen.queryByTestId('table-view-cell-editor-expand-button')).to
          .not.exist;
      });
    });

    describe('newly added element', function () {
      it('renders fieldname input, value input, and type dropdown', function () {
        const rowNode = getNode({});
        rowNode.data.hadronDocument.insertEnd('$new', '');
        const value = rowNode.data.hadronDocument.get('$new');
        const { container } = render(
          <CellEditor
            api={api as any}
            column={column as any}
            node={rowNode}
            value={value}
            removeColumn={actions.removeColumn}
            renameColumn={actions.renameColumn}
            elementAdded={actions.elementAdded}
            elementRemoved={actions.elementRemoved}
            elementTypeChanged={actions.elementTypeChanged}
            elementMarkRemoved={actions.elementMarkRemoved}
            drillDown={actions.drillDown}
            addColumn={actions.addColumn}
            tz="UTC"
            columnApi={columnApi as any}
            context={context}
          />
        );
        expect(screen.getByTestId('table-view-cell-editor-fieldname-input')).to
          .exist;
        expect(screen.getByTestId('table-view-cell-editor-value-input')).to
          .exist;
        expect(container.querySelector('.table-view-cell-editor-input-types'))
          .to.exist;
        // Does not render add/remove/expand buttons for newly added element
        expect(screen.queryByTestId('table-view-cell-editor-add-field-button'))
          .to.not.exist;
        expect(
          screen.queryByTestId('table-view-cell-editor-remove-field-button')
        ).to.not.exist;
        expect(screen.queryByTestId('table-view-cell-editor-expand-button')).to
          .not.exist;
      });
    });

    describe('empty element', function () {
      it('renders input field, type dropdown, and add button', function () {
        const rowNode = getNode({});
        const value = undefined;
        const { container } = render(
          <CellEditor
            api={api}
            column={column}
            node={rowNode}
            value={value}
            removeColumn={actions.removeColumn}
            renameColumn={actions.renameColumn}
            elementAdded={actions.elementAdded}
            elementRemoved={actions.elementRemoved}
            elementTypeChanged={actions.elementTypeChanged}
            elementMarkRemoved={actions.elementMarkRemoved}
            drillDown={actions.drillDown}
            addColumn={actions.addColumn}
            version="3.4.0"
            tz="UTC"
            columnApi={columnApi}
            context={context}
          />
        );
        expect(screen.getByTestId('table-view-cell-editor-value-input')).to
          .exist;
        expect(container.querySelector('.table-view-cell-editor-input-types'))
          .to.exist;
        expect(screen.getByTestId('table-view-cell-editor-add-field-button')).to
          .exist;
        // Does not render trash, fieldname input, or expand for empty element
        expect(
          screen.queryByTestId('table-view-cell-editor-remove-field-button')
        ).to.not.exist;
        expect(screen.queryByTestId('table-view-cell-editor-fieldname-input'))
          .to.not.exist;
        expect(screen.queryByTestId('table-view-cell-editor-expand-button')).to
          .not.exist;
      });
    });

    describe('expandable element', function () {
      it('renders type dropdown, expand, add, and remove buttons', function () {
        const rowNode = getNode({ field1: { subfield1: 'value' } });
        const value = rowNode.data.hadronDocument.get('field1');
        const { container } = render(
          <CellEditor
            api={api}
            column={column}
            node={rowNode}
            value={value}
            removeColumn={actions.removeColumn}
            renameColumn={actions.renameColumn}
            elementAdded={actions.elementAdded}
            elementRemoved={actions.elementRemoved}
            elementTypeChanged={actions.elementTypeChanged}
            elementMarkRemoved={actions.elementMarkRemoved}
            drillDown={actions.drillDown}
            addColumn={actions.addColumn}
            version="3.4.0"
            tz="UTC"
            columnApi={columnApi}
            context={context}
          />
        );
        expect(container.querySelector('.table-view-cell-editor-input-types'))
          .to.exist;
        expect(screen.getByTestId('table-view-cell-editor-expand-button')).to
          .exist;
        expect(screen.getByTestId('table-view-cell-editor-add-field-button')).to
          .exist;
        expect(screen.getByTestId('table-view-cell-editor-remove-field-button'))
          .to.exist;
        // Does not render input or fieldname input for expandable element
        expect(screen.queryByTestId('table-view-cell-editor-value-input')).to
          .not.exist;
        expect(screen.queryByTestId('table-view-cell-editor-fieldname-input'))
          .to.not.exist;
      });
    });

    describe('ObjectId', function () {
      it('top-level _id renders add field button only', function () {
        const rowNode = getNode({ field1: { _id: new ObjectId() } });
        const value = rowNode.data.hadronDocument.get('_id');
        const { container } = render(
          <CellEditor
            api={api}
            column={column}
            node={rowNode}
            value={value}
            removeColumn={actions.removeColumn}
            renameColumn={actions.renameColumn}
            elementAdded={actions.elementAdded}
            elementRemoved={actions.elementRemoved}
            elementTypeChanged={actions.elementTypeChanged}
            elementMarkRemoved={actions.elementMarkRemoved}
            drillDown={actions.drillDown}
            addColumn={actions.addColumn}
            version="3.4.0"
            tz="UTC"
            columnApi={columnApi}
            context={context}
          />
        );
        expect(screen.getByTestId('table-view-cell-editor-add-field-button')).to
          .exist;
        // Does not render other options for top-level _id
        expect(container.querySelector('.table-view-cell-editor-input-types'))
          .to.not.exist;
        expect(screen.queryByTestId('table-view-cell-editor-value-input')).to
          .not.exist;
        expect(screen.queryByTestId('table-view-cell-editor-fieldname-input'))
          .to.not.exist;
        expect(
          screen.queryByTestId('table-view-cell-editor-remove-field-button')
        ).to.not.exist;
        expect(screen.queryByTestId('table-view-cell-editor-expand-button')).to
          .not.exist;
      });

      it('sub-level _id renders type dropdown, add, remove buttons', function () {
        const rowNode = getNode({ field1: { _id: new ObjectId() } });
        const value = rowNode.data.hadronDocument.getChild(['field1', '_id']);
        const subContext = getContext(['field1']);
        const { container } = render(
          <CellEditor
            api={api}
            column={column}
            node={rowNode}
            value={value}
            removeColumn={actions.removeColumn}
            renameColumn={actions.renameColumn}
            elementAdded={actions.elementAdded}
            elementRemoved={actions.elementRemoved}
            elementTypeChanged={actions.elementTypeChanged}
            elementMarkRemoved={actions.elementMarkRemoved}
            drillDown={actions.drillDown}
            addColumn={actions.addColumn}
            version="3.4.0"
            tz="UTC"
            columnApi={columnApi}
            context={subContext}
          />
        );
        expect(container.querySelector('.table-view-cell-editor-input-types'))
          .to.exist;
        expect(screen.getByTestId('table-view-cell-editor-add-field-button')).to
          .exist;
        expect(screen.getByTestId('table-view-cell-editor-remove-field-button'))
          .to.exist;
        // Sub-level _id allows value editing and shows value input
        expect(screen.getByTestId('table-view-cell-editor-value-input')).to
          .exist;
        // Does not render fieldname input or expand for sub-level _id
        expect(screen.queryByTestId('table-view-cell-editor-fieldname-input'))
          .to.not.exist;
        expect(screen.queryByTestId('table-view-cell-editor-expand-button')).to
          .not.exist;
      });
    });
  });

  describe('#actions', function () {
    describe('editable element', function () {
      const columnApi = getColumnApi([]);
      const context = getContext([]);
      const column = getColumn('field1', {
        headerName: 'field1',
        headerComponentParams: { bsonType: 'String' },
      });

      it('handle edit - updates hadronElement and calls API on change', function () {
        const api = getApi();
        const actions = getActions();
        const rowNode = getNode({ field1: 'value' });
        const value = rowNode.data.hadronDocument.get('field1');

        render(
          <CellEditor
            api={api}
            node={rowNode}
            column={column}
            value={value}
            removeColumn={actions.removeColumn}
            renameColumn={actions.renameColumn}
            elementAdded={actions.elementAdded}
            elementRemoved={actions.elementRemoved}
            elementTypeChanged={actions.elementTypeChanged}
            elementMarkRemoved={actions.elementMarkRemoved}
            drillDown={actions.drillDown}
            addColumn={actions.addColumn}
            version="3.4.0"
            tz="UTC"
            context={context}
            columnApi={columnApi}
          />
        );

        const input = screen.getByTestId(
          'table-view-cell-editor-value-input'
        ) as HTMLInputElement;
        expect(input).to.exist;
        userEvent.clear(input);
        userEvent.type(input, 'new input');
        expect(input.value).to.equal('new input');
        // The element is updated when value changes
        expect(value.currentValue).to.equal('new input');
      });

      describe('handle type change', function () {
        it('when valid - updates the hadronElement type', function () {
          const api = getApi();
          const actions = getActions();
          const rowNode = getNode({ field1: '100' });
          const value = rowNode.data.hadronDocument.get('field1');

          render(
            <CellEditor
              api={api}
              node={rowNode}
              column={column}
              value={value}
              removeColumn={actions.removeColumn}
              renameColumn={actions.renameColumn}
              elementAdded={actions.elementAdded}
              elementRemoved={actions.elementRemoved}
              elementTypeChanged={actions.elementTypeChanged}
              elementMarkRemoved={actions.elementMarkRemoved}
              drillDown={actions.drillDown}
              addColumn={actions.addColumn}
              version="3.4.0"
              tz="UTC"
              context={context}
              columnApi={columnApi}
            />
          );

          // Initial type is String
          expect(value.currentType).to.equal('String');

          // Click on the type dropdown select button
          const selectButton = screen.getByRole('button', {
            name: /Field type/,
          });
          expect(selectButton).to.exist;
          userEvent.click(selectButton);

          // Get the listbox menu that appears
          const menuId = selectButton.getAttribute('aria-controls');
          const listbox = document.querySelector(
            `[id="${menuId}"][role="listbox"]`
          ) as HTMLElement;
          expect(listbox).to.exist;

          // Click on Int32 option to change the type
          const int32Option = within(listbox).getByText('Int32');
          userEvent.click(int32Option);

          // Verify the type was changed on the element
          expect(value.currentType).to.equal('Int32');
          // Int32 wraps value in an object, so check valueOf()
          expect(value.currentValue.valueOf()).to.equal(100);
        });
      });

      it('handle remove - clicking trash button marks element as removed', function () {
        const api = getApi();
        const actions = getActions();
        const rowNode = getNode({ field1: 'value' });
        const value = rowNode.data.hadronDocument.get('field1');

        render(
          <CellEditor
            api={api}
            node={rowNode}
            column={column}
            value={value}
            removeColumn={actions.removeColumn}
            renameColumn={actions.renameColumn}
            elementAdded={actions.elementAdded}
            elementRemoved={actions.elementRemoved}
            elementTypeChanged={actions.elementTypeChanged}
            elementMarkRemoved={actions.elementMarkRemoved}
            drillDown={actions.drillDown}
            addColumn={actions.addColumn}
            version="3.4.0"
            tz="UTC"
            context={context}
            columnApi={columnApi}
          />
        );

        const trashButton = screen.getByRole('button', {
          name: 'Remove field',
        });
        expect(trashButton).to.exist;
        userEvent.click(trashButton);

        // Element is marked as removed
        expect(value.isRemoved()).to.equal(true);
        // elementMarkRemoved action is called
        expect(actions.elementMarkRemoved.callCount).to.equal(1);
        // stopEditing is called
        expect(api.stopEditing.callCount).to.equal(1);
      });

      it('handle remove - for added element, calls elementRemoved', function () {
        const api = getApi();
        const actions = getActions();
        const rowNode = getNode({});
        rowNode.data.hadronDocument.insertEnd('field1', 'value');
        const value = rowNode.data.hadronDocument.get('field1');

        render(
          <CellEditor
            api={api}
            node={rowNode}
            column={column}
            value={value}
            removeColumn={actions.removeColumn}
            renameColumn={actions.renameColumn}
            elementAdded={actions.elementAdded}
            elementRemoved={actions.elementRemoved}
            elementTypeChanged={actions.elementTypeChanged}
            elementMarkRemoved={actions.elementMarkRemoved}
            drillDown={actions.drillDown}
            addColumn={actions.addColumn}
            version="3.4.0"
            tz="UTC"
            context={context}
            columnApi={columnApi}
          />
        );

        const trashButton = screen.getByRole('button', {
          name: 'Remove field',
        });
        expect(trashButton).to.exist;
        userEvent.click(trashButton);

        // Element is marked as removed
        expect(value.isRemoved()).to.equal(true);
        // elementRemoved action is called for added element
        expect(actions.elementRemoved.callCount).to.equal(1);
        // stopEditing is called
        expect(api.stopEditing.callCount).to.equal(1);
      });
    });

    describe('newly added element', function () {
      it('set field name - allows typing field name', function () {
        const api = getApi();
        const actions = getActions();
        const rowNode = getNode({});
        const colId = {};
        const column = getColumn('field1', colId);
        const columnApi = getColumnApi([]);
        const context = getContext([]);
        rowNode.data.hadronDocument.insertEnd('$new', '');
        const value = rowNode.data.hadronDocument.get('$new');

        render(
          <CellEditor
            api={api}
            node={rowNode}
            value={value}
            removeColumn={actions.removeColumn}
            renameColumn={actions.renameColumn}
            elementAdded={actions.elementAdded}
            elementRemoved={actions.elementRemoved}
            elementTypeChanged={actions.elementTypeChanged}
            elementMarkRemoved={actions.elementMarkRemoved}
            drillDown={actions.drillDown}
            addColumn={actions.addColumn}
            context={context}
            column={column}
            version="3.4.0"
            tz="UTC"
            columnApi={columnApi}
          />
        );

        const fieldInput = screen.getByTestId(
          'table-view-cell-editor-fieldname-input'
        ) as HTMLInputElement;
        expect(fieldInput).to.exist;
        userEvent.clear(fieldInput);
        userEvent.type(fieldInput, 'fieldname');
        expect(fieldInput.value).to.equal('fieldname');
      });

      it('set field name to duplicate key - typing duplicate key works', function () {
        const api = getApi();
        const actions = getActions();
        const rowNode = getNode({});
        const colId = {};
        const column = getColumn('field1', colId);
        const columnApi = getColumnApi([
          {
            getColDef: () => {
              return { colId: 'fieldname' };
            },
          },
        ]);
        const context = getContext([]);
        rowNode.data.hadronDocument.insertEnd('$new', '');
        const value = rowNode.data.hadronDocument.get('$new');

        render(
          <CellEditor
            api={api}
            node={rowNode}
            value={value}
            removeColumn={actions.removeColumn}
            renameColumn={actions.renameColumn}
            elementAdded={actions.elementAdded}
            elementRemoved={actions.elementRemoved}
            elementTypeChanged={actions.elementTypeChanged}
            elementMarkRemoved={actions.elementMarkRemoved}
            drillDown={actions.drillDown}
            addColumn={actions.addColumn}
            context={context}
            column={column}
            version="3.4.0"
            tz="UTC"
            columnApi={columnApi}
          />
        );

        const fieldInput = screen.getByTestId(
          'table-view-cell-editor-fieldname-input'
        ) as HTMLInputElement;
        expect(fieldInput).to.exist;
        userEvent.clear(fieldInput);
        userEvent.type(fieldInput, 'fieldname');
        // Typing duplicate key updates the input value
        expect(fieldInput.value).to.equal('fieldname');
      });
    });

    describe('empty element', function () {
      it('header exists - sets initial type from header bsonType', function () {
        const rowNode = getNode({});
        const value = undefined;
        const api = getApi();
        const actions = getActions();
        const column = getColumn('field1', {
          headerName: 'field1',
          headerComponentParams: { bsonType: 'Date' },
        });
        const context = getContext([]);
        const columnApi = getColumnApi([]);

        render(
          <CellEditor
            api={api}
            column={column}
            node={rowNode}
            value={value}
            removeColumn={actions.removeColumn}
            renameColumn={actions.renameColumn}
            elementAdded={actions.elementAdded}
            elementRemoved={actions.elementRemoved}
            elementTypeChanged={actions.elementTypeChanged}
            elementMarkRemoved={actions.elementMarkRemoved}
            drillDown={actions.drillDown}
            addColumn={actions.addColumn}
            columnApi={columnApi}
            version="3.4.0"
            tz="UTC"
            context={context}
          />
        );

        expect(rowNode.data.hadronDocument.get('field1').currentType).to.equal(
          'Date'
        );
        notCalledExcept(api, []);
        notCalledExcept(actions, []);
      });

      it('header with mixed type - sets initial type to Undefined', function () {
        const rowNode = getNode({});
        const value = undefined;
        const api = getApi();
        const actions = getActions();
        const column = getColumn('field1', {
          headerName: 'field1',
          headerComponentParams: { bsonType: 'mixed' },
        });
        const context = getContext([]);
        const columnApi = getColumnApi([]);

        render(
          <CellEditor
            api={api}
            column={column}
            node={rowNode}
            value={value}
            removeColumn={actions.removeColumn}
            renameColumn={actions.renameColumn}
            elementAdded={actions.elementAdded}
            elementRemoved={actions.elementRemoved}
            elementTypeChanged={actions.elementTypeChanged}
            elementMarkRemoved={actions.elementMarkRemoved}
            drillDown={actions.drillDown}
            addColumn={actions.addColumn}
            columnApi={columnApi}
            version="3.4.0"
            tz="UTC"
            context={context}
          />
        );

        expect(rowNode.data.hadronDocument.get('field1').currentType).to.equal(
          'Undefined'
        );
        notCalledExcept(api, []);
        notCalledExcept(actions, []);
      });

      it('close with editing - allows typing value', function () {
        const rowNode = getNode({});
        const value = undefined;
        const api = getApi();
        const actions = getActions();
        const column = getColumn('field1', {
          headerName: 'field1',
          headerComponentParams: { bsonType: 'String' },
        });
        const context = getContext([]);
        const columnApi = getColumnApi([]);

        render(
          <CellEditor
            api={api}
            column={column}
            node={rowNode}
            value={value}
            removeColumn={actions.removeColumn}
            renameColumn={actions.renameColumn}
            elementAdded={actions.elementAdded}
            elementRemoved={actions.elementRemoved}
            elementTypeChanged={actions.elementTypeChanged}
            elementMarkRemoved={actions.elementMarkRemoved}
            drillDown={actions.drillDown}
            addColumn={actions.addColumn}
            columnApi={columnApi}
            version="3.4.0"
            tz="UTC"
            context={context}
          />
        );

        const input = screen.getByTestId(
          'table-view-cell-editor-value-input'
        ) as HTMLInputElement;
        expect(input).to.exist;
        userEvent.clear(input);
        userEvent.type(input, 'new input');
        expect(input.value).to.equal('new input');
        // HadronDocument is updated with the new value
        expect(rowNode.data.hadronDocument.get('field1').currentValue).to.equal(
          'new input'
        );
      });
    });

    describe('expandable element', function () {
      it('clicking on expand calls drillDown action and stopEditing', function () {
        const rowNode = getNode({ field1: { subfield1: 'value' } });
        const value = rowNode.data.hadronDocument.get('field1');
        const api = getApi();
        const actions = getActions();
        const column = getColumn();
        const columnApi = getColumnApi([]);
        const context = getContext([]);

        render(
          <CellEditor
            api={api}
            column={column}
            node={rowNode}
            value={value}
            removeColumn={actions.removeColumn}
            renameColumn={actions.renameColumn}
            elementAdded={actions.elementAdded}
            elementRemoved={actions.elementRemoved}
            elementTypeChanged={actions.elementTypeChanged}
            elementMarkRemoved={actions.elementMarkRemoved}
            drillDown={actions.drillDown}
            addColumn={actions.addColumn}
            columnApi={columnApi}
            version="3.4.0"
            tz="UTC"
            context={context}
          />
        );

        const expandButton = screen.getByRole('button', {
          name: 'Expand field',
        });
        expect(expandButton).to.exist;
        userEvent.click(expandButton);

        // drillDown action is called
        expect(actions.drillDown.callCount).to.equal(1);
        expect(
          actions.drillDown.alwaysCalledWithExactly(
            rowNode.data.hadronDocument,
            value
          )
        ).to.equal(true);
        // stopEditing is called
        expect(api.stopEditing.callCount).to.equal(1);
        notCalledExcept(api, ['stopEditing']);
        notCalledExcept(actions, ['drillDown']);
      });
    });
  });
});
