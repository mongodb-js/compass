import React from 'react';
import { mount } from 'enzyme';
import { getNode, getApi, getColumn, getActions,
  getColumnApi, getContext, notCalledExcept} from '../../test/aggrid-helper';
import AddFieldButton from './table-view/add-field-button';
import AppRegistry from 'hadron-app-registry';
import app from 'hadron-app';

describe('<AddFieldButton />', () => {
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
    const column = getColumn('field1', { headerName: 'field1' });
    const actions = getActions();
    const columnApi = getColumnApi([]);
    const context = getContext([]);
    describe('object', () => {
      before((done) => {
        rowNode = getNode({field1: {'subfield1': 'value'}});
        value = rowNode.data.hadronDocument.get('field1');
        component = mount(
          <AddFieldButton
            api={api}
            column={column}
            node={rowNode}
            value={value}
            addColumn={actions.addColumn}
            drillDown={actions.drillDown}
            columnApi={columnApi}
            buttonRef="test"
            displace={20}
            context={context}
            displace={0}/>
        );
        done();
      });
      it('renders add next field', () => {
        expect(component.find({'data-test-id': 'add-field-after'})).to.be.present();
      });
      it('renders add field to object', () => {
        expect(component.find({'data-test-id': 'add-child-to-object'})).to.be.present();
      });
      it('does not render add array element', () => {
        expect(component.find({'data-test-id': 'add-element-to-array'})).to.not.be.present();
      });
    });

    describe('array', () => {
      before((done) => {
        rowNode = getNode({field1: ['item1', 'item2']});
        value = rowNode.data.hadronDocument.get('field1');
        component = mount(
          <AddFieldButton
            api={api}
            column={column}
            node={rowNode}
            value={value}
            addColumn={actions.addColumn}
            drillDown={actions.drillDown}
            columnApi={columnApi}
            buttonRef="test"
            displace={20}
            context={context}/>
        );
        done();
      });
      it('renders add next field', () => {
        expect(component.find({'data-test-id': 'add-field-after'})).to.be.present();
      });
      it('does not render add field to object', () => {
        expect(component.find({'data-test-id': 'add-child-to-object'})).to.not.be.present();
      });
      it('renders add array element', () => {
        expect(component.find({'data-test-id': 'add-element-to-array'})).to.be.present();
      });
    });

    describe('non-expandable element', () => {
      before((done) => {
        rowNode = getNode({field1: 'value'});
        value = rowNode.data.hadronDocument.get('field1');
        component = mount(
          <AddFieldButton
            api={api}
            column={column}
            node={rowNode}
            value={value}
            addColumn={actions.addColumn}
            drillDown={actions.drillDown}
            columnApi={columnApi}
            buttonRef="test"
            displace={20}
            context={context}/>
        );
        done();
      });
      it('renders add next field', () => {
        expect(component.find({'data-test-id': 'add-field-after'})).to.be.present();
      });
      it('does not render add field to object', () => {
        expect(component.find({'data-test-id': 'add-child-to-object'})).to.not.be.present();
      });
      it('does not render add array element', () => {
        expect(component.find({'data-test-id': 'add-element-to-array'})).to.not.be.present();
      });
    });
  });

  describe('#Actions', () => {
    const api = getApi();
    const columnApi = getColumnApi();
    const column = getColumn('field1', { headerName: 'field1', colId: 'field1' });
    let component;
    let rowNode;
    let value;

    describe('add next field', () => {
      describe('at the top level', () => {
        describe('when current element is empty', () => {
          const context = getContext([]);
          const actions = getActions();
          before((done) => {
            rowNode = getNode({});
            value = undefined;
            component = mount(
              <AddFieldButton
                api={api}
                column={column}
                node={rowNode}
                value={value}
                addColumn={actions.addColumn}
                drillDown={actions.drillDown}
                columnApi={columnApi}
                buttonRef="test"
                displace={20}
                context={context}/>
            );
            const wrapper = component.find({'data-test-id': 'add-field-after'});
            expect(wrapper).to.be.present();
            wrapper.simulate('click');
            done();
          });
          it('calls addColumn action', () => {
            expect(actions.addColumn.callCount).to.equal(1);
            expect(actions.addColumn.args[0]).to.deep.equal([
              '$new', 'field1', 2, [], false, false, '1'
            ]);
            notCalledExcept(actions, ['addColumn']);
          });
          it('adds the new element to the end of the element', () => {
            expect(rowNode.data.hadronDocument.elements.lastElement.currentKey).to.equal('$new');
          });
        });

        describe('when current element is not empty', () => {
          const context = getContext([]);
          const actions = getActions();
          before((done) => {
            rowNode = getNode({field1: 'value', field3: 'value3'});
            value = rowNode.data.hadronDocument.get('field1');
            component = mount(
              <AddFieldButton
                api={api}
                column={column}
                node={rowNode}
                value={value}
                addColumn={actions.addColumn}
                drillDown={actions.drillDown}
                columnApi={columnApi}
                buttonRef="test"
                displace={20}
                context={context}/>
            );
            const wrapper = component.find({'data-test-id': 'add-field-after'});
            expect(wrapper).to.be.present();
            wrapper.simulate('click');
            done();
          });
          it('calls addColumn action', () => {
            expect(actions.addColumn.callCount).to.equal(1);
            expect(actions.addColumn.args[0]).to.deep.equal([
              '$new', 'field1', 2, [], false, false, '1'
            ]);
            notCalledExcept(actions, ['addColumn']);
          });
          it('adds the new element after the current element', () => {
            expect(value.parent.elements.findNext(value).currentKey).to.equal('$new');
          });
        });
      });

      describe('when in nested view of object', () => {
        const context = getContext(['field0']);
        const actions = getActions();
        before((done) => {
          rowNode = getNode({field0: {field1: 'value'}});
          value = rowNode.data.hadronDocument.getChild(['field0', 'field1']);
          component = mount(
            <AddFieldButton
              api={api}
              column={column}
              node={rowNode}
              value={value}
              addColumn={actions.addColumn}
              drillDown={actions.drillDown}
              columnApi={columnApi}
              buttonRef="test"
              displace={20}
              context={context}/>
          );
          const wrapper = component.find({'data-test-id': 'add-field-after'});
          expect(wrapper).to.be.present();
          wrapper.simulate('click');
          done();
        });
        it('calls addColumn action', () => {
          expect(actions.addColumn.callCount).to.equal(1);
          expect(actions.addColumn.args[0]).to.deep.equal([
            '$new', 'field1', 2, ['field0'], false, false, '1'
          ]);
          notCalledExcept(actions, ['addColumn']);
        });
        it('adds the new element to the sub element', () => {
          expect(value.parent.elements.findNext(value).currentKey).to.equal('$new');
          expect(rowNode.data.hadronDocument.generateObject()).to.deep.equal({
            _id: '1', field0: {field1: 'value', $new: ''}
          });
        });
      });

      describe('when in nested view of array', () => {
        describe('when array is shorter than columns', () => {
          const arrayColumnApi = getColumnApi({0: '0', 1: '1', 2: '2', 3: '3'});
          describe('adding to the end of the array', () => {
            const context = getContext(['field0']);
            const actions = getActions();
            const arrayColumn = getColumn(2, {colId: 2});
            before((done) => {
              rowNode = getNode({field0: ['value0', 'value1', 'value2']});
              value = rowNode.data.hadronDocument.getChild(['field0', 2]);
              component = mount(
                <AddFieldButton
                  api={api}
                  column={arrayColumn}
                  node={rowNode}
                  value={value}
                  addColumn={actions.addColumn}
                  drillDown={actions.drillDown}
                  columnApi={arrayColumnApi}
                  buttonRef="test"
                  displace={20}
                  context={context}/>
              );
              const wrapper = component.find({'data-test-id': 'add-field-after'});
              expect(wrapper).to.be.present();
              wrapper.simulate('click');
              done();
            });
            it('calls addColumn action', () => {
              expect(actions.addColumn.callCount).to.equal(1);
              expect(actions.addColumn.args[0]).to.deep.equal([
                3, 2, 2, ['field0'], true, true, '1'
              ]);
              notCalledExcept(actions, ['addColumn']);
            });
            it('adds the new element to the sub element', () => {
              expect(value.parent.elements.findNext(value).currentKey).to.equal(3);
              expect(rowNode.data.hadronDocument.generateObject()).to.deep.equal({
                _id: '1', field0: ['value0', 'value1', 'value2', '']});
            });
          });
          describe('adding to the middle of an array', () => {
            const context = getContext(['field0']);
            const actions = getActions();
            const arrayColumn = getColumn(1, {colId: 1});
            before((done) => {
              rowNode = getNode({field0: ['value0', 'value1', 'value2']});
              value = rowNode.data.hadronDocument.getChild(['field0', 1]);
              component = mount(
                <AddFieldButton
                  api={api}
                  column={arrayColumn}
                  node={rowNode}
                  value={value}
                  addColumn={actions.addColumn}
                  drillDown={actions.drillDown}
                  columnApi={arrayColumnApi}
                  buttonRef="test"
                  displace={20}
                  context={context}/>
              );
              const wrapper = component.find({'data-test-id': 'add-field-after'});
              expect(wrapper).to.be.present();
              wrapper.simulate('click');
              done();
            });
            it('calls addColumn action', () => {
              expect(actions.addColumn.callCount).to.equal(1);
              expect(actions.addColumn.args[0]).to.deep.equal([
                2, 1, 2, ['field0'], true, true, '1'
              ]);
              notCalledExcept(actions, ['addColumn']);
            });
            it('adds the new element to the sub element', () => {
              expect(value.parent.elements.findNext(value).currentKey).to.equal(2);
              expect(rowNode.data.hadronDocument.generateObject()).to.deep.equal({
                _id: '1', field0: ['value0', 'value1', '', 'value2']});
            });
          });
        });
        describe('when array is longer than columns', () => {
          const arrayColumnApi = getColumnApi({0: '0', 1: '1', 2: '2'});
          describe('adding to the end of the array', () => {
            const context = getContext(['field0']);
            const actions = getActions();
            const arrayColumn = getColumn(2, {colId: 2});
            before((done) => {
              rowNode = getNode({field0: ['value0', 'value1', 'value2']});
              value = rowNode.data.hadronDocument.getChild(['field0', 2]);
              component = mount(
                <AddFieldButton
                  api={api}
                  column={arrayColumn}
                  node={rowNode}
                  value={value}
                  addColumn={actions.addColumn}
                  drillDown={actions.drillDown}
                  columnApi={arrayColumnApi}
                  buttonRef="test"
                  displace={20}
                  context={context}/>
              );
              const wrapper = component.find({'data-test-id': 'add-field-after'});
              expect(wrapper).to.be.present();
              wrapper.simulate('click');
              done();
            });
            it('calls addColumn action', () => {
              expect(actions.addColumn.callCount).to.equal(1);
              expect(actions.addColumn.args[0]).to.deep.equal([
                3, 2, 2, ['field0'], true, false, '1'
              ]);
              notCalledExcept(actions, ['addColumn']);
            });
            it('adds the new element to the sub element', () => {
              expect(value.parent.elements.findNext(value).currentKey).to.equal(3);
              expect(rowNode.data.hadronDocument.generateObject()).to.deep.equal({
                _id: '1', field0: ['value0', 'value1', 'value2', '']});
            });
          });
          describe('adding to the middle of an array', () => {
            const context = getContext(['field0']);
            const actions = getActions();
            const arrayColumn = getColumn(1, {colId: 1});
            before((done) => {
              rowNode = getNode({field0: ['value0', 'value1', 'value2']});
              value = rowNode.data.hadronDocument.getChild(['field0', 1]);
              component = mount(
                <AddFieldButton
                  api={api}
                  column={arrayColumn}
                  node={rowNode}
                  value={value}
                  addColumn={actions.addColumn}
                  drillDown={actions.drillDown}
                  columnApi={arrayColumnApi}
                  buttonRef="test"
                  displace={20}
                  context={context}/>
              );
              const wrapper = component.find({'data-test-id': 'add-field-after'});
              expect(wrapper).to.be.present();
              wrapper.simulate('click');
              done();
            });
            it('calls addColumn action', () => {
              expect(actions.addColumn.callCount).to.equal(1);
              expect(actions.addColumn.args[0]).to.deep.equal([
                2, 1, 2, ['field0'], true, false, '1'
              ]);
              notCalledExcept(actions, ['addColumn']);
            });
            it('adds the new element to the sub element', () => {
              expect(value.parent.elements.findNext(value).currentKey).to.equal(2);
              expect(rowNode.data.hadronDocument.generateObject()).to.deep.equal({
                _id: '1', field0: ['value0', 'value1', '', 'value2']});
            });
          });
        });
      });
    });

    describe('add element to object', () => {
      const context = getContext(['field0']);
      const actions = getActions();
      before((done) => {
        rowNode = getNode({field0: {field1: 'value'}});
        value = rowNode.data.hadronDocument.getChild(['field0']);
        component = mount(
          <AddFieldButton
            api={api}
            column={column}
            node={rowNode}
            value={value}
            addColumn={actions.addColumn}
            drillDown={actions.drillDown}
            columnApi={columnApi}
            buttonRef="test"
            displace={20}
            context={context}/>
        );
        const wrapper = component.find({'data-test-id': 'add-child-to-object'});
        expect(wrapper).to.be.present();
        wrapper.simulate('click');
        done();
      });
      it('calls drillDown action', () => {
        expect(actions.drillDown.callCount).to.equal(1);
        expect(actions.drillDown.args[0]).to.deep.equal([
          rowNode.data.hadronDocument,
          value,
          {colId: '$new', rowIndex: 2}
        ]);
        notCalledExcept(actions, ['drillDown']);
      });
      it('adds the new element to the sub element', () => {
        const child = rowNode.data.hadronDocument.getChild(['field0', 'field1']);
        expect(child.parent.elements.findNext(child).currentKey).to.equal('$new');
        expect(rowNode.data.hadronDocument.generateObject()).to.deep.equal({
          _id: '1', field0: {field1: 'value', $new: ''}
        });
      });
    });

    describe('add array element to array', () => {
      const context = getContext(['field0']);
      const actions = getActions();
      before((done) => {
        rowNode = getNode({field0: ['value0', 'value1', 'value2']});
        value = rowNode.data.hadronDocument.getChild(['field0']);
        component = mount(
          <AddFieldButton
            api={api}
            column={column}
            node={rowNode}
            value={value}
            addColumn={actions.addColumn}
            drillDown={actions.drillDown}
            columnApi={columnApi}
            buttonRef="test"
            displace={20}
            context={context}/>
        );
        const wrapper = component.find({'data-test-id': 'add-element-to-array'});
        expect(wrapper).to.be.present();
        wrapper.simulate('click');
        done();
      });
      it('calls drillDown action', () => {
        expect(actions.drillDown.callCount).to.equal(1);
        expect(actions.drillDown.args[0]).to.deep.equal([
          rowNode.data.hadronDocument,
          value,
          {colId: 3, rowIndex: 2}
        ]);
        notCalledExcept(actions, ['drillDown']);
      });
      it('adds the new element to the sub element', () => {
        const child = rowNode.data.hadronDocument.getChild(['field0']);
        expect(child.elements.lastElement.currentKey).to.equal(3);
        expect(rowNode.data.hadronDocument.generateObject()).to.deep.equal({
          _id: '1', field0: ['value0', 'value1', 'value2', '']});
      });
    });
  });
});
