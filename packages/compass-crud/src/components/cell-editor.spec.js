import React from 'react';
import { mount } from 'enzyme';
import { getNode, getApi, getColumn, getActions,
  getColumnApi, getContext, notCalledExcept} from '../../test/aggrid-helper';
import CellEditor from './table-view/cell-editor';
import AppRegistry from 'hadron-app-registry';
import { ObjectID as ObjectId } from 'bson';
import app from 'hadron-app';

describe('<CellEditor />', () => {
  before(() => {
    global.hadronApp = app;
    global.hadronApp.appRegistry = new AppRegistry();
  });

  after(() => {
    global.hadronApp.appRegistry = new AppRegistry();
  });

  describe('#render', () => {
    let component;
    let rowNode;
    let value;
    const api = getApi();
    const column = getColumn('field1', {
      headerName: 'field1',
      headerComponentParams: { bsonType: 'String'}
    });
    const actions = getActions();
    const columnApi = getColumnApi([]);
    const context = getContext([]);
    describe('editable element', () => {
      before((done) => {
        rowNode = getNode({field1: 'value'});
        value = rowNode.data.hadronDocument.get('field1');
        component = mount(<CellEditor
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
          tz="UTC"
          version="3.4.0"
          columnApi={columnApi}
          context={context}/>
        );
        done();
      });
      it('renders the input field', () => {
        const wrapper = component.find('.table-view-cell-editor');
        expect(wrapper.find(
          '.editable-element-value-wrapper-is-string')).to.be.present();
      });

      it('renders the type cast dropdown', () => {
        const wrapper = component.find('.table-view-cell-editor');
        expect(wrapper.find('.table-view-cell-editor-types')).to.be.present();
      });

      it('renders the add field button', () => {
        const wrapper = component.find('.table-view-cell-editor');
        expect(wrapper.find('.fa-plus-square-o')).to.be.present();
      });

      it('renders the remove field button', () => {
        const wrapper = component.find('.table-view-cell-editor');
        expect(wrapper.find('.fa-trash')).to.be.present();
      });

      it('does not render other options', () => {
        const wrapper = component.find('.table-view-cell-editor');
        expect(wrapper.find(
          '.table-view-cell-editor-input-field-inner')).to.not.be.present();
        expect(wrapper.find('.fa-expand')).to.not.be.present();
      });
    });

    describe('newly added element', () => {
      before((done) => {
        rowNode = getNode({});
        rowNode.data.hadronDocument.insertEnd('$new', '');
        value = rowNode.data.hadronDocument.get('$new');
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
            context={context}/>
        );
        done();
      });
      it('renders the fieldname input field', () => {
        const wrapper = component.find('.table-view-cell-editor');
        expect(wrapper.find(
          '.table-view-cell-editor-input-field-inner')).to.be.present();
      });

      it('renders the input field', () => {
        const wrapper = component.find('.table-view-cell-editor');
        expect(wrapper.find(
          '.editable-element-value-wrapper-is-string')).to.be.present();
      });

      it('renders the type cast dropdown', () => {
        const wrapper = component.find('.table-view-cell-editor');
        expect(wrapper.find('.table-view-cell-editor-types')).to.be.present();
      });

      it('does not render other options', () => {
        const wrapper = component.find('.table-view-cell-editor');
        expect(wrapper.find('.fa-plus-square-o')).to.not.be.present();
        expect(wrapper.find('.fa-trash')).to.not.be.present();
        expect(wrapper.find('.fa-expand')).to.not.be.present();
      });
    });

    describe('empty element', () => {
      before((done) => {
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
            context={context}/>
        );
        done();
      });
      it('renders the input field', () => {
        const wrapper = component.find('.table-view-cell-editor');
        expect(wrapper.find(
          '.editable-element-value-wrapper-is-string')).to.be.present();
      });

      it('renders the type cast dropdown', () => {
        const wrapper = component.find('.table-view-cell-editor');
        expect(wrapper.find('.table-view-cell-editor-types')).to.be.present();
      });

      it('renders the add field button', () => {
        const wrapper = component.find('.table-view-cell-editor');
        expect(wrapper.find('.fa-plus-square-o')).to.be.present();
      });

      it('does not render other options', () => {
        const wrapper = component.find('.table-view-cell-editor');
        expect(wrapper.find('.fa-trash')).to.not.be.present();
        expect(wrapper.find(
          '.table-view-cell-editor-input-field-inner')).to.not.be.present();
        expect(wrapper.find('.fa-expand')).to.not.be.present();
      });
    });

    describe('expandable element', () => {
      before((done) => {
        rowNode = getNode({field1: {subfield1: 'value'}});
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
            context={context}/>
        );
        done();
      });
      it('renders the type cast dropdown', () => {
        const wrapper = component.find('.table-view-cell-editor');
        expect(wrapper.find('.table-view-cell-editor-types')).to.be.present();
      });

      it('renders the expand button', () => {
        const wrapper = component.find('.table-view-cell-editor');
        expect(wrapper.find('.fa-expand')).to.be.present();
      });

      it('renders the add field button', () => {
        const wrapper = component.find('.table-view-cell-editor');
        expect(wrapper.find('.fa-plus-square-o')).to.be.present();
      });

      it('renders the remove field button', () => {
        const wrapper = component.find('.table-view-cell-editor');
        expect(wrapper.find('.fa-trash')).to.be.present();
      });

      it('does not render other options', () => {
        const wrapper = component.find('.table-view-cell-editor');
        expect(wrapper.find('.table-view-cell-editor-input')).to.not.be.present();
        expect(wrapper.find(
          '.table-view-cell-editor-input-field-inner')).to.not.be.present();
      });
    });

    describe('ObjectId', () => {
      before((done) => {
        rowNode = getNode({field1: {_id: new ObjectId()}});
        done();
      });
      describe('top-level', () => {
        before((done) => {
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
              context={context}/>
          );
          done();
        });
        it('renders the add field button', () => {
          const wrapper = component.find('.table-view-cell-editor');
          expect(wrapper.find('.fa-plus-square-o')).to.be.present();
        });

        it('does not render other options', () => {
          const wrapper = component.find('.table-view-cell-editor');
          expect(wrapper.find('.table-view-cell-editor-types')).to.not.be.present();
          expect(wrapper.find('.table-view-cell-editor-input')).to.not.be.present();
          expect(wrapper.find(
            '.table-view-cell-editor-input-field-inner')).to.not.be.present();
          expect(wrapper.find('.fa-trash')).to.not.be.present();
          expect(wrapper.find('.fa-expand')).to.not.be.present();
        });
      });
      describe('sub-level', () => {
        before((done) => {
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
              context={context}/>
          );
          done();
        });
        it('renders the type cast dropdown', () => {
          const wrapper = component.find('.table-view-cell-editor');
          expect(wrapper.find('.table-view-cell-editor-types')).to.be.present();
        });

        it('renders the add field button', () => {
          const wrapper = component.find('.table-view-cell-editor');
          expect(wrapper.find('.fa-plus-square-o')).to.be.present();
        });

        it('renders the remove field button', () => {
          const wrapper = component.find('.table-view-cell-editor');
          expect(wrapper.find('.fa-trash')).to.be.present();
        });

        it('does not render other options', () => {
          const wrapper = component.find('.table-view-cell-editor');
          expect(wrapper.find('.table-view-cell-editor-input')).to.not.be.present();
          expect(wrapper.find(
            '.table-view-cell-editor-input-field-inner')).to.not.be.present();
          expect(wrapper.find('.fa-expand')).to.not.be.present();
        });
      });
    });
  });

  describe('#actions', () => {
    describe('editable element', () => {
      const columnApi = getColumnApi([]);
      const context = getContext([]);
      const column = getColumn('field1', {
        headerName: 'field1',
        headerComponentParams: { bsonType: 'String'}
      });
      describe('handle edit', () => {
        const api = getApi();
        const actions = getActions();
        const rowNode = getNode({field1: 'value'});
        const value = rowNode.data.hadronDocument.get('field1');
        let component;
        before((done) => {
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
              columnApi={columnApi}/>
          );
          const wrapper = component.find('.editable-element-value-is-string');
          wrapper.simulate('change', {target: {value: 'new input'}});
          expect(component.find('.editable-element-value-is-string').props().value).to.equal('new input');
          /*  Have to call isCancelAfterEnd directly because
           *  props.api.stopEditing doesn't call it because it's a spy */
          component.instance().isCancelAfterEnd();
          component.unmount();
          done();
        });
        it('unmounting calls stopEditing', () => {
          expect(api.stopEditing.callCount).to.equal(1);
        });
        it('unmounting calls refreshCells', () => {
          expect(api.refreshCells.callCount).to.equal(1);
          expect(api.refreshCells.args[0]).to.deep.equal([{rowNodes: [rowNode], force: true}]);
        });
        it('updates the hadronElement', () => {
          expect(value.currentValue).to.equal('new input');
        });
        it('does not trigger other actions', () => {
          notCalledExcept(api, ['stopEditing', 'refreshCells']);
          notCalledExcept(actions, []);
        });
      });
      describe('handle type change', () => {
        let component;
        describe('when valid', () => {
          const api = getApi();
          const actions = getActions();
          const rowNode = getNode({field1: '100'});
          const value = rowNode.data.hadronDocument.get('field1');
          before((done) => {
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
                columnApi={columnApi}/>
            );
            const item = component.find('.table-view-cell-editor-input-types');
            const item2 = component.find('.editable-element-type-int32');
            expect(item2).to.be.present();
            item2.simulate('mousedown');
            item.simulate('blur');
            component.instance().isCancelAfterEnd();
            done();
          });
          it('updates the hadronElement type', () => {
            expect(value.currentType).to.equal('Int32');
          });
          it('updates the hadronElement value', () => {
            expect(value.currentValue.value).to.equal(100);
          });
          it('does not call api.stopEditing()', () => {
            expect(api.stopEditing.callCount).to.equal(0);
          });
          it('unmounting calls refreshCells', () => {
            expect(api.refreshCells.callCount).to.equal(1);
            expect(api.refreshCells.args[0]).to.deep.equal([{rowNodes: [rowNode], force: true}]);
          });
          it('calls elementTypeChanged', () => {
            expect(actions.elementTypeChanged.callCount).to.equal(1);
            expect(actions.elementTypeChanged.alwaysCalledWithExactly(
              'field1', 'Int32', '1')).to.equal(true);
          });
          it('does not trigger other actions', () => {
            notCalledExcept(api, ['stopEditing', 'refreshCells']);
            notCalledExcept(actions, ['elementTypeChanged']);
          });
        });
        describe('when invalid', () => {
          const api = getApi();
          const actions = getActions();
          const rowNode = getNode({field1: 'value'});
          const value = rowNode.data.hadronDocument.get('field1');
          before((done) => {
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
                column={column}/>
            );
            const item = component.find('.table-view-cell-editor-input-types');
            const item2 = component.find('.editable-element-type-date');
            expect(item2).to.be.present();
            item2.simulate('mousedown');
            item.simulate('blur');
            component.instance().isCancelAfterEnd();
            done();
          });
          it('updates the hadronElement type', () => {
            expect(value.currentType).to.equal('Date');
          });
          it('updates the hadronElement value to undefined', () => {
            expect(value.currentValue.value).to.equal(undefined);
          });
          it('does not call api.stopEditing()', () => {
            expect(api.stopEditing.callCount).to.equal(0);
          });
          it('unmounting calls refreshCells', () => {
            expect(api.refreshCells.callCount).to.equal(1);
            expect(api.refreshCells.args[0]).to.deep.equal([{rowNodes: [rowNode], force: true}]);
          });
          it('calls elementTypeChanged', () => {
            expect(actions.elementTypeChanged.callCount).to.equal(1);
            expect(actions.elementTypeChanged.alwaysCalledWithExactly(
              'field1', 'Date', '1')).to.equal(true);
          });
          it('does not trigger other actions', () => {
            notCalledExcept(api, ['stopEditing', 'refreshCells']);
            notCalledExcept(actions, ['elementTypeChanged']);
          });
        });
      });
      describe('handle remove', () => {
        describe('element not added', () => {
          const api = getApi();
          const actions = getActions();
          const rowNode = getNode({field1: 'value'});
          const value = rowNode.data.hadronDocument.get('field1');
          let component;
          before((done) => {
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
                columnApi={columnApi}/>
            );
            const wrapper = component.find('.fa-trash');
            expect(wrapper).to.be.present();
            wrapper.simulate('mousedown');
            component.instance().isCancelAfterEnd();
            done();
          });
          it('calls elementMarkRemoved action', () => {
            expect(actions.elementMarkRemoved.callCount).to.equal(1);
          });
          it('marks the Element as removed', () => {
            expect(value.isRemoved()).to.equal(true);
          });
          it('calls api.stopEditing()', () => {
            expect(api.stopEditing.callCount).to.equal(1);
          });
          it('unmounting calls refreshCells', () => {
            expect(api.refreshCells.callCount).to.equal(1);
            expect(api.refreshCells.args[0]).to.deep.equal([{rowNodes: [rowNode], force: true}]);
          });
          it('does not trigger other actions', () => {
            notCalledExcept(api, ['stopEditing', 'refreshCells']);
            notCalledExcept(actions, ['elementMarkRemoved']);
          });
        });
      });
      describe('element added', () => {
        const api = getApi();
        const actions = getActions();
        const rowNode = getNode({});
        rowNode.data.hadronDocument.insertEnd('field1', 'value');
        const value = rowNode.data.hadronDocument.get('field1');
        let component;
        before((done) => {
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
              columnApi={columnApi}/>
          );
          const wrapper = component.find('.fa-trash');
          expect(wrapper).to.be.present();
          wrapper.simulate('mousedown');
          component.instance().isCancelAfterEnd();
          done();
        });
        it('calls elementRemoved action', () => {
          expect(actions.elementRemoved.callCount).to.equal(1);
        });
        it('marks the Element as removed', () => {
          expect(value.isRemoved()).to.equal(true);
        });
        it('calls api.stopEditing()', () => {
          expect(api.stopEditing.callCount).to.equal(1);
        });
        it('unmounting calls refreshCells', () => {
          expect(api.refreshCells.callCount).to.equal(1);
          expect(api.refreshCells.args[0]).to.deep.equal([{rowNodes: [rowNode], force: true}]);
        });
        it('does not trigger other actions', () => {
          notCalledExcept(api, ['stopEditing', 'refreshCells']);
          notCalledExcept(actions, ['elementRemoved']);
        });
      });
    });

    describe('newly added element', () => {
      describe('set field name', () => {
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
        before((done) => {
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
              columnApi={columnApi}/>
          );
          const wrapper = component.find('.editable-element-field');
          wrapper.simulate('change', {target: {value: 'fieldname'}});
          expect(component.find('.editable-element-field').props().value).to.equal('fieldname');
          component.instance().isCancelAfterEnd();
          done();
        });
        it('adds a new element to HadronDocument', () => {
          expect(value.currentKey).to.equal('fieldname');
          expect(rowNode.data.hadronDocument.get(
            'fieldname').currentValue).to.equal('');
        });
        it('renames the column with the fieldname', () => {
          expect(colId.headerName).to.equal('fieldname');
        });
        it('calls elementAdded action', () => {
          expect(actions.elementAdded.callCount).to.equal(1);
          expect(actions.elementAdded.alwaysCalledWithExactly(
            'fieldname', 'String', '1')).to.equal(true);
        });
        it('calls renameColumn', () => {
          expect(actions.renameColumn.callCount).to.equal(1);
          expect(actions.renameColumn.alwaysCalledWithExactly(
            '$new', 'fieldname')).to.equal(true);
        });
        it('calls refreshHeader', () => {
          expect(api.refreshHeader.callCount).to.equal(1);
        });
        it('unmounting calls refreshCells', () => {
          expect(api.refreshCells.callCount).to.equal(1);
          expect(api.refreshCells.args[0]).to.deep.equal([{rowNodes: [rowNode], force: true}]);
        });
        it('does not trigger other actions', () => {
          notCalledExcept(api, ['refreshHeader', 'refreshCells']);
          notCalledExcept(actions, ['elementAdded', 'renameColumn']);
        });
      });
      describe('set field name to duplicate key', () => {
        const api = getApi();
        const actions = getActions();
        const rowNode = getNode({});
        const colId = {};
        const column = getColumn('field1', colId);
        const columnApi = getColumnApi([{getColDef: () => {
          return {colId: 'fieldname'};
        }}]);
        const context = getContext([]);
        rowNode.data.hadronDocument.insertEnd('$new', '');
        const value = rowNode.data.hadronDocument.get('$new');
        let component;
        before((done) => {
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
              columnApi={columnApi}/>
          );
          const wrapper = component.find('.editable-element-field');
          wrapper.simulate('change', {target: {value: 'fieldname'}});
          expect(component.find('.editable-element-field-is-duplicate').props().value).to.equal('fieldname');
          component.instance().isCancelAfterEnd();
          done();
        });
        it('removes element from HadronDocument', () => {
          expect(rowNode.data.hadronDocument.generateObject()).to.deep.equal({_id: '1'});
        });
        it('calls removeColumn action', () => {
          expect(actions.removeColumn.callCount).to.equal(1);
          expect(actions.removeColumn.alwaysCalledWithExactly('$new')).to.equal(true);
        });
        it('does not trigger other actions', () => {
          notCalledExcept(api, []);
          notCalledExcept(actions, ['removeColumn']);
        });
      });
      describe('close without editing', () => {
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
        before((done) => {
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
              columnApi={columnApi}/>
          );
          component.instance().isCancelAfterEnd();
          done();
        });
        it('removes element from HadronDocument', () => {
          expect(rowNode.data.hadronDocument.generateObject()).to.deep.equal({_id: '1'});
        });
        it('calls removeColumn action', () => {
          expect(actions.removeColumn.callCount).to.equal(1);
          expect(actions.removeColumn.alwaysCalledWithExactly('$new'));
        });
        it('does not trigger other actions', () => {
          notCalledExcept(api, []);
          notCalledExcept(actions, ['removeColumn']);
        });
      });
      describe('close without editing fieldname', () => {
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
        before((done) => {
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
              columnApi={columnApi}/>
          );
          const wrapper = component.find('.editable-element-value-is-string');
          wrapper.simulate('change', {target: {value: 'new input'}});
          expect(component.find('.editable-element-value-is-string').props().value).to.equal('new input');
          component.instance().isCancelAfterEnd();
          done();
        });
        it('removes element from HadronDocument', () => {
          expect(rowNode.data.hadronDocument.generateObject()).to.deep.equal({_id: '1'});
        });
        it('calls removeColumn action', () => {
          expect(actions.removeColumn.callCount).to.equal(1);
          expect(actions.removeColumn.alwaysCalledWithExactly(
            '$new')).to.equal(true);
        });
        it('does not trigger other actions', () => {
          notCalledExcept(api, []);
          notCalledExcept(actions, ['removeColumn']);
        });
      });
    });

    describe('empty element', () => {
      describe('header exists', () => {
        const rowNode = getNode({});
        const value = undefined;
        const api = getApi();
        const actions = getActions();
        const column = getColumn('field1', {
          headerName: 'field1',
          headerComponentParams: { bsonType: 'Date'}
        });
        const context = getContext([]);
        const columnApi = getColumnApi([]);
        before((done) => {
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
              context={context}/>);
          done();
        });
        it('sets the initial type to what the header has', () => {
          expect(rowNode.data.hadronDocument.get(
            'field1').currentType).to.equal('Date');
        });
        it('does not trigger other actions', () => {
          notCalledExcept(api, []);
          notCalledExcept(actions, []);
        });
      });
      describe('header does not exist', () => {
        const rowNode = getNode({});
        const value = undefined;
        const api = getApi();
        const actions = getActions();
        const column = getColumn('field1', {
          headerName: 'field1',
          headerComponentParams: { bsonType: 'mixed'}
        });
        const context = getContext([]);
        const columnApi = getColumnApi([]);
        before((done) => {
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
              context={context}/>
          );
          done();
        });
        it('sets the initial type to what the header has', () => {
          expect(rowNode.data.hadronDocument.get(
            'field1').currentType).to.equal('Undefined');
        });
        it('does not trigger other actions', () => {
          notCalledExcept(api, []);
          notCalledExcept(actions, []);
        });
      });
      describe('close without editing', () => {
        const rowNode = getNode({});
        const value = undefined;
        const api = getApi();
        const actions = getActions();
        const column = getColumn('field1', {
          headerName: 'field1',
          headerComponentParams: { bsonType: 'String'}
        });
        const context = getContext([]);
        const columnApi = getColumnApi([]);
        before((done) => {
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
              context={context}/>
          );
          component.instance().isCancelAfterEnd();
          done();
        });
        it('reverts the element', () => {
          expect(rowNode.data.hadronDocument.generateObject()).to.deep.equal(
            {_id: '1'});
        });
        it('does not trigger other actions', () => {
          notCalledExcept(api, []);
          notCalledExcept(actions, []);
        });
      });
      describe('close with editing', () => {
        const rowNode = getNode({});
        const value = undefined;
        const api = getApi();
        const actions = getActions();
        const column = getColumn('field1', {
          headerName: 'field1',
          headerComponentParams: { bsonType: 'String'}
        });
        const context = getContext([]);
        const columnApi = getColumnApi([]);
        before((done) => {
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
              context={context}/>
          );
          const wrapper = component.find('.editable-element-value-is-string');
          wrapper.simulate('change', {target: {value: 'new input'}});
          expect(component.find('.editable-element-value-is-string').props().value).to.equal('new input');
          component.instance().isCancelAfterEnd();
          done();
        });
        it('updates the HadronDocument', () => {
          expect(rowNode.data.hadronDocument.get('field1').currentValue).to.equal('new input');
        });
        it('calls elementAdded action', () => {
          expect(actions.elementAdded.callCount).to.equal(1);
          expect(actions.elementAdded.alwaysCalledWithExactly(
            'field1', 'String', '1')).to.equal(true);
        });
        it('calls refreshCells', () => {
          expect(api.refreshCells.callCount).to.equal(1);
          expect(api.refreshCells.args[0]).to.deep.equal([{rowNodes: [rowNode], force: true}]);
        });
        it('does not trigger other actions', () => {
          notCalledExcept(api, ['refreshCells']);
          notCalledExcept(actions, ['elementAdded']);
        });
      });
      describe('in a nested element', () => {
        const rowNode = getNode({field: {subfield: {}}});
        const value = undefined;
        const api = getApi();
        const actions = getActions();
        const column = getColumn('subsubfield', {
          headerName: 'subsubfield',
          headerComponentParams: { bsonType: 'String'}
        });
        const context = getContext(['field', 'subfield']);
        const columnApi = getColumnApi([]);
        before((done) => {
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
              context={context}/>
          );
          const wrapper = component.find('.editable-element-value-is-string');
          wrapper.simulate('change', {target: {value: 'new input'}});
          expect(component.find('.editable-element-value-is-string').props().value).to.equal('new input');
          component.instance().isCancelAfterEnd();
          done();
        });
        it('updates the HadronDocument correctly nested', () => {
          expect(rowNode.data.hadronDocument.getChild(
            ['field', 'subfield', 'subsubfield']).currentValue).to.equal('new input');
        });
        it('calls elementAdded action', () => {
          expect(actions.elementAdded.callCount).to.equal(1);
          expect(actions.elementAdded.alwaysCalledWithExactly(
            'subsubfield', 'String', '1')).to.equal(true);
        });
        it('calls refreshCells', () => {
          expect(api.refreshCells.callCount).to.equal(1);
          expect(api.refreshCells.args[0]).to.deep.equal([{rowNodes: [rowNode], force: true}]);
        });
        it('does not trigger other actions', () => {
          notCalledExcept(api, ['refreshCells']);
          notCalledExcept(actions, ['elementAdded']);
        });
      });
    });

    describe('for an expandable element, clicking on expand', () => {
      const rowNode = getNode({field1: {subfield1: 'value'}});
      const value = rowNode.data.hadronDocument.get('field1');
      const api = getApi();
      const actions = getActions();
      const column = getColumn();
      const columnApi = getColumnApi([]);
      const context = getContext([]);
      before((done) => {
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
            context={context}/>
        );
        const wrapper = component.find('.fa-expand');
        expect(wrapper).to.be.present();
        wrapper.simulate('mousedown');
        done();
      });
      it('calls drillDown action', () => {
        expect(actions.drillDown.callCount).to.equal(1);
        expect(actions.drillDown.alwaysCalledWithExactly(
          rowNode.data.hadronDocument, value)).to.equal(true);
      });
      it('calls api.stopEditing()', () => {
        expect(api.stopEditing.callCount).to.equal(1);
      });
      it('does not trigger other actions', () => {
        notCalledExcept(api, ['stopEditing']);
        notCalledExcept(actions, ['drillDown']);
      });
    });
  });
});
