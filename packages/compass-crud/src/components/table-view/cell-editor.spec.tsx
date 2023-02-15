import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';
import AppRegistry from 'hadron-app-registry';
import { ObjectId } from 'bson';
import app from 'hadron-app';

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

describe.skip('<CellEditor />', function () {
  before(function () {
    global.hadronApp = app;
    global.hadronApp.appRegistry = new AppRegistry();
  });

  after(function () {
    global.hadronApp.appRegistry = new AppRegistry();
  });

  describe('#render', function () {
    let component;
    let rowNode;
    let value;
    const api = getApi();
    const column = getColumn('field1', {
      headerName: 'field1',
      headerComponentParams: { bsonType: 'String' },
    });
    const actions = getActions();
    const columnApi = getColumnApi([]);
    const context = getContext([]);
    describe('editable element', function () {
      before(function (done) {
        rowNode = getNode({ field1: 'value' });
        value = rowNode.data.hadronDocument.get('field1');
        component = mount(
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
            {...({
              /* missing props */
            } as any)}
          />
        );
        done();
      });
      it('renders the input field', function () {
        const wrapper = component.find('.table-view-cell-editor');
        (
          expect(
            wrapper.find('.editable-element-value-wrapper-is-string')
          ) as any
        ).to.be.present();
      });

      it('renders the type cast dropdown', function () {
        const wrapper = component.find('.table-view-cell-editor');
        expect(wrapper.find('.table-view-cell-editor-types')).to.be.present();
      });

      it('renders the add field button', function () {
        const wrapper = component.find('.table-view-cell-editor');
        expect(wrapper.find('.fa-plus-square-o')).to.be.present();
      });

      it('renders the remove field button', function () {
        const wrapper = component.find('.table-view-cell-editor');
        expect(wrapper.find('.fa-trash')).to.be.present();
      });

      it('does not render other options', function () {
        const wrapper = component.find('.table-view-cell-editor');
        (
          expect(
            wrapper.find('.table-view-cell-editor-input-field-inner')
          ) as any
        ).to.not.be.present();
        expect(wrapper.find('.fa-expand')).to.not.be.present();
      });
    });

    describe('newly added element', function () {
      before(function (done) {
        rowNode = getNode({});
        rowNode.data.hadronDocument.insertEnd('$new', '');
        value = rowNode.data.hadronDocument.get('$new');
        component = mount(
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
            {...({
              /* missing props */
            } as any)}
          />
        );
        done();
      });
      it('renders the fieldname input field', function () {
        const wrapper = component.find('.table-view-cell-editor');
        expect(
          wrapper.find('.table-view-cell-editor-input-field-inner')
        ).to.be.present();
      });

      it('renders the input field', function () {
        const wrapper = component.find('.table-view-cell-editor');
        expect(
          wrapper.find('.editable-element-value-wrapper-is-string')
        ).to.be.present();
      });

      it('renders the type cast dropdown', function () {
        const wrapper = component.find('.table-view-cell-editor');
        expect(wrapper.find('.table-view-cell-editor-types')).to.be.present();
      });

      it('does not render other options', function () {
        const wrapper = component.find('.table-view-cell-editor');
        expect(wrapper.find('.fa-plus-square-o')).to.not.be.present();
        expect(wrapper.find('.fa-trash')).to.not.be.present();
        expect(wrapper.find('.fa-expand')).to.not.be.present();
      });
    });

    describe('empty element', function () {
      before(function (done) {
        rowNode = getNode({});
        value = undefined;
        component = mount(
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
        done();
      });
      it('renders the input field', function () {
        const wrapper = component.find('.table-view-cell-editor');
        expect(
          wrapper.find('.editable-element-value-wrapper-is-string')
        ).to.be.present();
      });

      it('renders the type cast dropdown', function () {
        const wrapper = component.find('.table-view-cell-editor');
        expect(wrapper.find('.table-view-cell-editor-types')).to.be.present();
      });

      it('renders the add field button', function () {
        const wrapper = component.find('.table-view-cell-editor');
        expect(wrapper.find('.fa-plus-square-o')).to.be.present();
      });

      it('does not render other options', function () {
        const wrapper = component.find('.table-view-cell-editor');
        expect(wrapper.find('.fa-trash')).to.not.be.present();
        expect(
          wrapper.find('.table-view-cell-editor-input-field-inner')
        ).to.not.be.present();
        expect(wrapper.find('.fa-expand')).to.not.be.present();
      });
    });

    describe('expandable element', function () {
      before(function (done) {
        rowNode = getNode({ field1: { subfield1: 'value' } });
        value = rowNode.data.hadronDocument.get('field1');
        component = mount(
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
        done();
      });
      it('renders the type cast dropdown', function () {
        const wrapper = component.find('.table-view-cell-editor');
        expect(wrapper.find('.table-view-cell-editor-types')).to.be.present();
      });

      it('renders the expand button', function () {
        const wrapper = component.find('.table-view-cell-editor');
        expect(wrapper.find('.fa-expand')).to.be.present();
      });

      it('renders the add field button', function () {
        const wrapper = component.find('.table-view-cell-editor');
        expect(wrapper.find('.fa-plus-square-o')).to.be.present();
      });

      it('renders the remove field button', function () {
        const wrapper = component.find('.table-view-cell-editor');
        expect(wrapper.find('.fa-trash')).to.be.present();
      });

      it('does not render other options', function () {
        const wrapper = component.find('.table-view-cell-editor');
        expect(
          wrapper.find('.table-view-cell-editor-input')
        ).to.not.be.present();
        expect(
          wrapper.find('.table-view-cell-editor-input-field-inner')
        ).to.not.be.present();
      });
    });

    describe('ObjectId', function () {
      before(function (done) {
        rowNode = getNode({ field1: { _id: new ObjectId() } });
        done();
      });
      describe('top-level', function () {
        before(function (done) {
          value = rowNode.data.hadronDocument.get('_id');
          component = mount(
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
          done();
        });
        it('renders the add field button', function () {
          const wrapper = component.find('.table-view-cell-editor');
          expect(wrapper.find('.fa-plus-square-o')).to.be.present();
        });

        it('does not render other options', function () {
          const wrapper = component.find('.table-view-cell-editor');
          expect(
            wrapper.find('.table-view-cell-editor-types')
          ).to.not.be.present();
          expect(
            wrapper.find('.table-view-cell-editor-input')
          ).to.not.be.present();
          expect(
            wrapper.find('.table-view-cell-editor-input-field-inner')
          ).to.not.be.present();
          expect(wrapper.find('.fa-trash')).to.not.be.present();
          expect(wrapper.find('.fa-expand')).to.not.be.present();
        });
      });
      describe('sub-level', function () {
        before(function (done) {
          value = rowNode.data.hadronDocument.getChild(['field1', '_id']);
          context.path = ['field1'];
          component = mount(
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
          done();
        });
        it('renders the type cast dropdown', function () {
          const wrapper = component.find('.table-view-cell-editor');
          expect(wrapper.find('.table-view-cell-editor-types')).to.be.present();
        });

        it('renders the add field button', function () {
          const wrapper = component.find('.table-view-cell-editor');
          expect(wrapper.find('.fa-plus-square-o')).to.be.present();
        });

        it('renders the remove field button', function () {
          const wrapper = component.find('.table-view-cell-editor');
          expect(wrapper.find('.fa-trash')).to.be.present();
        });

        it('renders other options', function () {
          const wrapper = component.find('.table-view-cell-editor');
          expect(wrapper.find('.table-view-cell-editor-input')).to.be.present();
          expect(
            wrapper.find('.table-view-cell-editor-input-field-inner')
          ).to.not.be.present();
          expect(wrapper.find('.fa-expand')).to.not.be.present();
        });
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
      describe('handle edit', function () {
        const api = getApi();
        const actions = getActions();
        const rowNode = getNode({ field1: 'value' });
        const value = rowNode.data.hadronDocument.get('field1');
        let component;
        before(function (done) {
          component = mount(
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
          const wrapper = component.find('.editable-element-value-is-string');
          wrapper.simulate('change', { target: { value: 'new input' } });
          expect(
            component.find('.editable-element-value-is-string').props().value
          ).to.equal('new input');
          /*  Have to call isCancelAfterEnd directly because
           *  props.api.stopEditing doesn't call it because it's a spy */
          component.instance().isCancelAfterEnd();
          component.unmount();
          done();
        });
        it('unmounting calls stopEditing', function () {
          expect(api.stopEditing.callCount).to.equal(1);
        });
        it('unmounting calls refreshCells', function () {
          expect(api.refreshCells.callCount).to.equal(1);
          expect(api.refreshCells.args[0]).to.deep.equal([
            { rowNodes: [rowNode], force: true },
          ]);
        });
        it('updates the hadronElement', function () {
          expect(value.currentValue).to.equal('new input');
        });
        it('does not trigger other actions', function () {
          notCalledExcept(api, ['stopEditing', 'refreshCells']);
          notCalledExcept(actions, []);
        });
      });

      // Enzyme doesn't like the Transition, skipping here as part of this is already
      // tested elsewhere. To be revisited when enzyme will be replaced.
      describe.skip('handle type change', function () {
        let component;
        describe('when valid', function () {
          const api = getApi();
          const actions = getActions();
          const rowNode = getNode({ field1: '100' });
          const value = rowNode.data.hadronDocument.get('field1');
          before(function (done) {
            component = mount(
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
            const item = component.find(
              '[data-testid="table-view-types-dropdown-select"] Select'
            );
            expect(item).to.be.present();
            item.simulate('mousedown');

            const item2 = component.find(
              '[data-testid="editable-element-type-Int32"]'
            );
            expect(item2).to.be.present();
            item2.simulate('mousedown');
            item.simulate('blur');
            component.instance().isCancelAfterEnd();
            done();
          });
          it('updates the hadronElement type', function () {
            expect(value.currentType).to.equal('Int32');
          });
          it('updates the hadronElement value', function () {
            expect(value.currentValue.value).to.equal(100);
          });
          it('does not call api.stopEditing()', function () {
            expect(api.stopEditing.callCount).to.equal(0);
          });
          it('unmounting calls refreshCells', function () {
            expect(api.refreshCells.callCount).to.equal(1);
            expect(api.refreshCells.args[0]).to.deep.equal([
              { rowNodes: [rowNode], force: true },
            ]);
          });
          it('calls elementTypeChanged', function () {
            expect(actions.elementTypeChanged.callCount).to.equal(1);
            expect(
              actions.elementTypeChanged.alwaysCalledWithExactly(
                'field1',
                'Int32',
                '1'
              )
            ).to.equal(true);
          });
          it('does not trigger other actions', function () {
            notCalledExcept(api, ['stopEditing', 'refreshCells']);
            notCalledExcept(actions, ['elementTypeChanged']);
          });
        });
        describe('when invalid', function () {
          const api = getApi();
          const actions = getActions();
          const rowNode = getNode({ field1: 'value' });
          const value = rowNode.data.hadronDocument.get('field1');
          before(function (done) {
            component = mount(
              <CellEditor
                api={api}
                node={rowNode}
                columnApi={columnApi}
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
                column={column}
              />
            );
            const item = component.find('.table-view-cell-editor-input-types');
            const item2 = component.find('.editable-element-type-date');
            expect(item2).to.be.present();
            item2.simulate('mousedown');
            item.simulate('blur');
            component.instance().isCancelAfterEnd();
            done();
          });
          it('updates the hadronElement type', function () {
            expect(value.currentType).to.equal('Date');
          });
          it('updates the hadronElement value to undefined', function () {
            expect(value.currentValue.value).to.equal(undefined);
          });
          it('does not call api.stopEditing()', function () {
            expect(api.stopEditing.callCount).to.equal(0);
          });
          it('unmounting calls refreshCells', function () {
            expect(api.refreshCells.callCount).to.equal(1);
            expect(api.refreshCells.args[0]).to.deep.equal([
              { rowNodes: [rowNode], force: true },
            ]);
          });
          it('calls elementTypeChanged', function () {
            expect(actions.elementTypeChanged.callCount).to.equal(1);
            expect(
              actions.elementTypeChanged.alwaysCalledWithExactly(
                'field1',
                'Date',
                '1'
              )
            ).to.equal(true);
          });
          it('does not trigger other actions', function () {
            notCalledExcept(api, ['stopEditing', 'refreshCells']);
            notCalledExcept(actions, ['elementTypeChanged']);
          });
        });
      });
      describe('handle remove', function () {
        describe('element not added', function () {
          const api = getApi();
          const actions = getActions();
          const rowNode = getNode({ field1: 'value' });
          const value = rowNode.data.hadronDocument.get('field1');
          let component;
          before(function (done) {
            component = mount(
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
            const wrapper = component.find('.fa-trash');
            expect(wrapper).to.be.present();
            wrapper.simulate('mousedown');
            component.instance().isCancelAfterEnd();
            done();
          });
          it('calls elementMarkRemoved action', function () {
            expect(actions.elementMarkRemoved.callCount).to.equal(1);
          });
          it('marks the Element as removed', function () {
            expect(value.isRemoved()).to.equal(true);
          });
          it('calls api.stopEditing()', function () {
            expect(api.stopEditing.callCount).to.equal(1);
          });
          it('unmounting calls refreshCells', function () {
            expect(api.refreshCells.callCount).to.equal(1);
            expect(api.refreshCells.args[0]).to.deep.equal([
              { rowNodes: [rowNode], force: true },
            ]);
          });
          it('does not trigger other actions', function () {
            notCalledExcept(api, ['stopEditing', 'refreshCells']);
            notCalledExcept(actions, ['elementMarkRemoved']);
          });
        });
      });
      describe('element added', function () {
        const api = getApi();
        const actions = getActions();
        const rowNode = getNode({});
        rowNode.data.hadronDocument.insertEnd('field1', 'value');
        const value = rowNode.data.hadronDocument.get('field1');
        let component;
        before(function (done) {
          component = mount(
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
          const wrapper = component.find('.fa-trash');
          expect(wrapper).to.be.present();
          wrapper.simulate('mousedown');
          component.instance().isCancelAfterEnd();
          done();
        });
        it('calls elementRemoved action', function () {
          expect(actions.elementRemoved.callCount).to.equal(1);
        });
        it('marks the Element as removed', function () {
          expect(value.isRemoved()).to.equal(true);
        });
        it('calls api.stopEditing()', function () {
          expect(api.stopEditing.callCount).to.equal(1);
        });
        it('unmounting calls refreshCells', function () {
          expect(api.refreshCells.callCount).to.equal(1);
          expect(api.refreshCells.args[0]).to.deep.equal([
            { rowNodes: [rowNode], force: true },
          ]);
        });
        it('does not trigger other actions', function () {
          notCalledExcept(api, ['stopEditing', 'refreshCells']);
          notCalledExcept(actions, ['elementRemoved']);
        });
      });
    });

    describe('newly added element', function () {
      describe('set field name', function () {
        const api = getApi();
        const actions = getActions();
        const rowNode = getNode({});
        const colId = {};
        const column = getColumn('field1', colId);
        const columnApi = getColumnApi([]);
        const context = getContext([]);
        rowNode.data.hadronDocument.insertEnd('$new', '');
        const value = rowNode.data.hadronDocument.get('$new');
        let component;
        before(function (done) {
          component = mount(
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
          const wrapper = component.find('.editable-element-field');
          wrapper.simulate('change', { target: { value: 'fieldname' } });
          expect(
            component.find('.editable-element-field').props().value
          ).to.equal('fieldname');
          component.instance().isCancelAfterEnd();
          done();
        });
        it('adds a new element to HadronDocument', function () {
          expect(value.currentKey).to.equal('fieldname');
          expect(
            rowNode.data.hadronDocument.get('fieldname').currentValue
          ).to.equal('');
        });
        it('renames the column with the fieldname', function () {
          expect(colId.headerName).to.equal('fieldname');
        });
        it('calls elementAdded action', function () {
          expect(actions.elementAdded.callCount).to.equal(1);
          expect(
            actions.elementAdded.alwaysCalledWithExactly(
              'fieldname',
              'String',
              '1'
            )
          ).to.equal(true);
        });
        it('calls renameColumn', function () {
          expect(actions.renameColumn.callCount).to.equal(1);
          expect(
            actions.renameColumn.alwaysCalledWithExactly('$new', 'fieldname')
          ).to.equal(true);
        });
        it('calls refreshHeader', function () {
          expect(api.refreshHeader.callCount).to.equal(1);
        });
        it('unmounting calls refreshCells', function () {
          expect(api.refreshCells.callCount).to.equal(1);
          expect(api.refreshCells.args[0]).to.deep.equal([
            { rowNodes: [rowNode], force: true },
          ]);
        });
        it('does not trigger other actions', function () {
          notCalledExcept(api, ['refreshHeader', 'refreshCells']);
          notCalledExcept(actions, ['elementAdded', 'renameColumn']);
        });
      });
      describe('set field name to duplicate key', function () {
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
        let component;
        before(function (done) {
          component = mount(
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
          const wrapper = component.find('.editable-element-field');
          wrapper.simulate('change', { target: { value: 'fieldname' } });
          expect(
            component.find('.editable-element-field-is-duplicate').props().value
          ).to.equal('fieldname');
          component.instance().isCancelAfterEnd();
          done();
        });
        it('removes element from HadronDocument', function () {
          expect(rowNode.data.hadronDocument.generateObject()).to.deep.equal({
            _id: '1',
          });
        });
        it('calls removeColumn action', function () {
          expect(actions.removeColumn.callCount).to.equal(1);
          expect(actions.removeColumn.alwaysCalledWithExactly('$new')).to.equal(
            true
          );
        });
        it('does not trigger other actions', function () {
          notCalledExcept(api, []);
          notCalledExcept(actions, ['removeColumn']);
        });
      });
      describe('close without editing', function () {
        const api = getApi();
        const actions = getActions();
        const rowNode = getNode({});
        const colId = {};
        const column = getColumn('field1', colId);
        const columnApi = getColumnApi([]);
        const context = getContext([]);
        rowNode.data.hadronDocument.insertEnd('$new', '');
        const value = rowNode.data.hadronDocument.get('$new');
        let component;
        before(function (done) {
          component = mount(
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
          component.instance().isCancelAfterEnd();
          done();
        });
        it('removes element from HadronDocument', function () {
          expect(rowNode.data.hadronDocument.generateObject()).to.deep.equal({
            _id: '1',
          });
        });
        it('calls removeColumn action', function () {
          expect(actions.removeColumn.callCount).to.equal(1);
          expect(actions.removeColumn.alwaysCalledWithExactly('$new'));
        });
        it('does not trigger other actions', function () {
          notCalledExcept(api, []);
          notCalledExcept(actions, ['removeColumn']);
        });
      });
      describe('close without editing fieldname', function () {
        const api = getApi();
        const actions = getActions();
        const rowNode = getNode({});
        const colId = {};
        const column = getColumn('field1', colId);
        const columnApi = getColumnApi([]);
        const context = getContext([]);
        rowNode.data.hadronDocument.insertEnd('$new', '');
        const value = rowNode.data.hadronDocument.get('$new');
        let component;
        before(function (done) {
          component = mount(
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
          const wrapper = component.find('.editable-element-value-is-string');
          wrapper.simulate('change', { target: { value: 'new input' } });
          expect(
            component.find('.editable-element-value-is-string').props().value
          ).to.equal('new input');
          component.instance().isCancelAfterEnd();
          done();
        });
        it('removes element from HadronDocument', function () {
          expect(rowNode.data.hadronDocument.generateObject()).to.deep.equal({
            _id: '1',
          });
        });
        it('calls removeColumn action', function () {
          expect(actions.removeColumn.callCount).to.equal(1);
          expect(actions.removeColumn.alwaysCalledWithExactly('$new')).to.equal(
            true
          );
        });
        it('does not trigger other actions', function () {
          notCalledExcept(api, []);
          notCalledExcept(actions, ['removeColumn']);
        });
      });
    });

    describe('empty element', function () {
      describe('header exists', function () {
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
        before(function (done) {
          mount(
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
          done();
        });
        it('sets the initial type to what the header has', function () {
          expect(
            rowNode.data.hadronDocument.get('field1').currentType
          ).to.equal('Date');
        });
        it('does not trigger other actions', function () {
          notCalledExcept(api, []);
          notCalledExcept(actions, []);
        });
      });
      describe('header does not exist', function () {
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
        before(function (done) {
          mount(
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
          done();
        });
        it('sets the initial type to what the header has', function () {
          expect(
            rowNode.data.hadronDocument.get('field1').currentType
          ).to.equal('Undefined');
        });
        it('does not trigger other actions', function () {
          notCalledExcept(api, []);
          notCalledExcept(actions, []);
        });
      });
      describe('close without editing', function () {
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
        before(function (done) {
          const component = mount(
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
          component.instance().isCancelAfterEnd();
          done();
        });
        it('reverts the element', function () {
          expect(rowNode.data.hadronDocument.generateObject()).to.deep.equal({
            _id: '1',
          });
        });
        it('does not trigger other actions', function () {
          notCalledExcept(api, []);
          notCalledExcept(actions, []);
        });
      });
      describe('close with editing', function () {
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
        before(function (done) {
          const component = mount(
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
          const wrapper = component.find('.editable-element-value-is-string');
          wrapper.simulate('change', { target: { value: 'new input' } });
          expect(
            component.find('.editable-element-value-is-string').props().value
          ).to.equal('new input');
          component.instance().isCancelAfterEnd();
          done();
        });
        it('updates the HadronDocument', function () {
          expect(
            rowNode.data.hadronDocument.get('field1').currentValue
          ).to.equal('new input');
        });
        it('calls elementAdded action', function () {
          expect(actions.elementAdded.callCount).to.equal(1);
          expect(
            actions.elementAdded.alwaysCalledWithExactly(
              'field1',
              'String',
              '1'
            )
          ).to.equal(true);
        });
        it('calls refreshCells', function () {
          expect(api.refreshCells.callCount).to.equal(1);
          expect(api.refreshCells.args[0]).to.deep.equal([
            { rowNodes: [rowNode], force: true },
          ]);
        });
        it('does not trigger other actions', function () {
          notCalledExcept(api, ['refreshCells']);
          notCalledExcept(actions, ['elementAdded']);
        });
      });
      describe('in a nested element', function () {
        const rowNode = getNode({ field: { subfield: {} } });
        const value = undefined;
        const api = getApi();
        const actions = getActions();
        const column = getColumn('subsubfield', {
          headerName: 'subsubfield',
          headerComponentParams: { bsonType: 'String' },
        });
        const context = getContext(['field', 'subfield']);
        const columnApi = getColumnApi([]);
        before(function (done) {
          const component = mount(
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
          const wrapper = component.find('.editable-element-value-is-string');
          wrapper.simulate('change', { target: { value: 'new input' } });
          expect(
            component.find('.editable-element-value-is-string').props().value
          ).to.equal('new input');
          component.instance().isCancelAfterEnd();
          done();
        });
        it('updates the HadronDocument correctly nested', function () {
          expect(
            rowNode.data.hadronDocument.getChild([
              'field',
              'subfield',
              'subsubfield',
            ]).currentValue
          ).to.equal('new input');
        });
        it('calls elementAdded action', function () {
          expect(actions.elementAdded.callCount).to.equal(1);
          expect(
            actions.elementAdded.alwaysCalledWithExactly(
              'subsubfield',
              'String',
              '1'
            )
          ).to.equal(true);
        });
        it('calls refreshCells', function () {
          expect(api.refreshCells.callCount).to.equal(1);
          expect(api.refreshCells.args[0]).to.deep.equal([
            { rowNodes: [rowNode], force: true },
          ]);
        });
        it('does not trigger other actions', function () {
          notCalledExcept(api, ['refreshCells']);
          notCalledExcept(actions, ['elementAdded']);
        });
      });
    });

    describe('for an expandable element, clicking on expand', function () {
      const rowNode = getNode({ field1: { subfield1: 'value' } });
      const value = rowNode.data.hadronDocument.get('field1');
      const api = getApi();
      const actions = getActions();
      const column = getColumn();
      const columnApi = getColumnApi([]);
      const context = getContext([]);
      before(function (done) {
        const component = mount(
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
        const wrapper = component.find('.fa-expand');
        expect(wrapper).to.be.present();
        wrapper.simulate('mousedown');
        done();
      });
      it('calls drillDown action', function () {
        expect(actions.drillDown.callCount).to.equal(1);
        expect(
          actions.drillDown.alwaysCalledWithExactly(
            rowNode.data.hadronDocument,
            value
          )
        ).to.equal(true);
      });
      it('calls api.stopEditing()', function () {
        expect(api.stopEditing.callCount).to.equal(1);
      });
      it('does not trigger other actions', function () {
        notCalledExcept(api, ['stopEditing']);
        notCalledExcept(actions, ['drillDown']);
      });
    });
  });
});
