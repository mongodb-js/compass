import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';
import AppRegistry from 'hadron-app-registry';
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
import AddFieldButton from './add-field-button';

describe('<AddFieldButton />', function () {
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
    const column = getColumn('field1', { headerName: 'field1' });
    const actions = getActions();
    const columnApi = getColumnApi([]);
    const context = getContext([]);
    describe('object', function () {
      before(function (done) {
        rowNode = getNode({ field1: { subfield1: 'value' } });
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
            context={context}
            displace={0}
          />
        );
        done();
      });
      it('renders add next field', function () {
        expect(
          component.find({ 'data-testid': 'add-field-after' })
        ).to.be.present();
      });
      it('renders add field to object', function () {
        expect(
          component.find({ 'data-testid': 'add-child-to-object' })
        ).to.be.present();
      });
      it('does not render add array element', function () {
        expect(
          component.find({ 'data-testid': 'add-element-to-array' })
        ).to.not.be.present();
      });
    });

    describe('array', function () {
      before(function (done) {
        rowNode = getNode({ field1: ['item1', 'item2'] });
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
          />
        );
        done();
      });
      it('renders add next field', function () {
        expect(
          component.find({ 'data-testid': 'add-field-after' })
        ).to.be.present();
      });
      it('does not render add field to object', function () {
        expect(
          component.find({ 'data-testid': 'add-child-to-object' })
        ).to.not.be.present();
      });
      it('renders add array element', function () {
        expect(
          component.find({ 'data-testid': 'add-element-to-array' })
        ).to.be.present();
      });
    });

    describe('non-expandable element', function () {
      before(function (done) {
        rowNode = getNode({ field1: 'value' });
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
          />
        );
        done();
      });
      it('renders add next field', function () {
        expect(
          component.find({ 'data-testid': 'add-field-after' })
        ).to.be.present();
      });
      it('does not render add field to object', function () {
        expect(
          component.find({ 'data-testid': 'add-child-to-object' })
        ).to.not.be.present();
      });
      it('does not render add array element', function () {
        expect(
          component.find({ 'data-testid': 'add-element-to-array' })
        ).to.not.be.present();
      });
    });
  });

  describe('#Actions', function () {
    const api = getApi();
    const columnApi = getColumnApi();
    const column = getColumn('field1', {
      headerName: 'field1',
      colId: 'field1',
    });
    let component;
    let rowNode;
    let value;

    describe('add next field', function () {
      describe('at the top level', function () {
        describe('when current element is empty', function () {
          const context = getContext([]);
          const actions = getActions();
          before(function (done) {
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
                context={context}
              />
            );
            const wrapper = component.find({
              'data-testid': 'add-field-after',
            });
            expect(wrapper).to.be.present();
            wrapper.simulate('click');
            done();
          });
          it('calls addColumn action', function () {
            expect(actions.addColumn.callCount).to.equal(1);
            expect(actions.addColumn.args[0]).to.deep.equal([
              '$new',
              'field1',
              2,
              [],
              false,
              false,
              '1',
            ]);
            notCalledExcept(actions, ['addColumn']);
          });
          it('adds the new element to the end of the element', function () {
            expect(
              rowNode.data.hadronDocument.elements.lastElement.currentKey
            ).to.equal('$new');
          });
        });

        describe('when current element is not empty', function () {
          const context = getContext([]);
          const actions = getActions();
          before(function (done) {
            rowNode = getNode({ field1: 'value', field3: 'value3' });
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
              />
            );
            const wrapper = component.find({
              'data-testid': 'add-field-after',
            });
            expect(wrapper).to.be.present();
            wrapper.simulate('click');
            done();
          });
          it('calls addColumn action', function () {
            expect(actions.addColumn.callCount).to.equal(1);
            expect(actions.addColumn.args[0]).to.deep.equal([
              '$new',
              'field1',
              2,
              [],
              false,
              false,
              '1',
            ]);
            notCalledExcept(actions, ['addColumn']);
          });
          it('adds the new element after the current element', function () {
            expect(value.nextElement.currentKey).to.equal('$new');
          });
        });
      });

      describe('when in nested view of object', function () {
        const context = getContext(['field0']);
        const actions = getActions();
        before(function (done) {
          rowNode = getNode({ field0: { field1: 'value' } });
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
              context={context}
            />
          );
          const wrapper = component.find({ 'data-testid': 'add-field-after' });
          expect(wrapper).to.be.present();
          wrapper.simulate('click');
          done();
        });
        it('calls addColumn action', function () {
          expect(actions.addColumn.callCount).to.equal(1);
          expect(actions.addColumn.args[0]).to.deep.equal([
            '$new',
            'field1',
            2,
            ['field0'],
            false,
            false,
            '1',
          ]);
          notCalledExcept(actions, ['addColumn']);
        });
        it('adds the new element to the sub element', function () {
          expect(value.nextElement.currentKey).to.equal('$new');
          expect(rowNode.data.hadronDocument.generateObject()).to.deep.equal({
            _id: '1',
            field0: { field1: 'value', $new: '' },
          });
        });
      });

      describe('when in nested view of array', function () {
        describe('when array is shorter than columns', function () {
          const arrayColumnApi = getColumnApi({
            0: '0',
            1: '1',
            2: '2',
            3: '3',
          });
          describe('adding to the end of the array', function () {
            const context = getContext(['field0']);
            const actions = getActions();
            const arrayColumn = getColumn(2, { colId: 2 });
            before(function (done) {
              rowNode = getNode({ field0: ['value0', 'value1', 'value2'] });
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
                  context={context}
                />
              );
              const wrapper = component.find({
                'data-testid': 'add-field-after',
              });
              expect(wrapper).to.be.present();
              wrapper.simulate('click');
              done();
            });
            it('calls addColumn action', function () {
              expect(actions.addColumn.callCount).to.equal(1);
              expect(actions.addColumn.args[0]).to.deep.equal([
                3,
                2,
                2,
                ['field0'],
                true,
                true,
                '1',
              ]);
              notCalledExcept(actions, ['addColumn']);
            });
            it('adds the new element to the sub element', function () {
              expect(value.nextElement.currentKey).to.equal(3);
              expect(
                rowNode.data.hadronDocument.generateObject()
              ).to.deep.equal({
                _id: '1',
                field0: ['value0', 'value1', 'value2', ''],
              });
            });
          });
          describe('adding to the middle of an array', function () {
            const context = getContext(['field0']);
            const actions = getActions();
            const arrayColumn = getColumn(1, { colId: 1 });
            before(function (done) {
              rowNode = getNode({ field0: ['value0', 'value1', 'value2'] });
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
                  context={context}
                />
              );
              const wrapper = component.find({
                'data-testid': 'add-field-after',
              });
              expect(wrapper).to.be.present();
              wrapper.simulate('click');
              done();
            });
            it('calls addColumn action', function () {
              expect(actions.addColumn.callCount).to.equal(1);
              expect(actions.addColumn.args[0]).to.deep.equal([
                2,
                1,
                2,
                ['field0'],
                true,
                true,
                '1',
              ]);
              notCalledExcept(actions, ['addColumn']);
            });
            it('adds the new element to the sub element', function () {
              expect(value.nextElement.currentKey).to.equal(2);
              expect(
                rowNode.data.hadronDocument.generateObject()
              ).to.deep.equal({
                _id: '1',
                field0: ['value0', 'value1', '', 'value2'],
              });
            });
          });
        });
        describe('when array is longer than columns', function () {
          const arrayColumnApi = getColumnApi({ 0: '0', 1: '1', 2: '2' });
          describe('adding to the end of the array', function () {
            const context = getContext(['field0']);
            const actions = getActions();
            const arrayColumn = getColumn(2, { colId: 2 });
            before(function (done) {
              rowNode = getNode({ field0: ['value0', 'value1', 'value2'] });
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
                  context={context}
                />
              );
              const wrapper = component.find({
                'data-testid': 'add-field-after',
              });
              expect(wrapper).to.be.present();
              wrapper.simulate('click');
              done();
            });
            it('calls addColumn action', function () {
              expect(actions.addColumn.callCount).to.equal(1);
              expect(actions.addColumn.args[0]).to.deep.equal([
                3,
                2,
                2,
                ['field0'],
                true,
                false,
                '1',
              ]);
              notCalledExcept(actions, ['addColumn']);
            });
            it('adds the new element to the sub element', function () {
              expect(value.nextElement.currentKey).to.equal(3);
              expect(
                rowNode.data.hadronDocument.generateObject()
              ).to.deep.equal({
                _id: '1',
                field0: ['value0', 'value1', 'value2', ''],
              });
            });
          });
          describe('adding to the middle of an array', function () {
            const context = getContext(['field0']);
            const actions = getActions();
            const arrayColumn = getColumn(1, { colId: 1 });
            before(function (done) {
              rowNode = getNode({ field0: ['value0', 'value1', 'value2'] });
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
                  context={context}
                />
              );
              const wrapper = component.find({
                'data-testid': 'add-field-after',
              });
              expect(wrapper).to.be.present();
              wrapper.simulate('click');
              done();
            });
            it('calls addColumn action', function () {
              expect(actions.addColumn.callCount).to.equal(1);
              expect(actions.addColumn.args[0]).to.deep.equal([
                2,
                1,
                2,
                ['field0'],
                true,
                false,
                '1',
              ]);
              notCalledExcept(actions, ['addColumn']);
            });
            it('adds the new element to the sub element', function () {
              expect(value.nextElement.currentKey).to.equal(2);
              expect(
                rowNode.data.hadronDocument.generateObject()
              ).to.deep.equal({
                _id: '1',
                field0: ['value0', 'value1', '', 'value2'],
              });
            });
          });
        });
      });
    });

    describe('add element to object', function () {
      const context = getContext(['field0']);
      const actions = getActions();
      before(function (done) {
        rowNode = getNode({ field0: { field1: 'value' } });
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
            context={context}
          />
        );
        const wrapper = component.find({
          'data-testid': 'add-child-to-object',
        });
        expect(wrapper).to.be.present();
        wrapper.simulate('click');
        done();
      });
      it('calls drillDown action', function () {
        expect(actions.drillDown.callCount).to.equal(1);
        expect(actions.drillDown.args[0]).to.deep.equal([
          rowNode.data.hadronDocument,
          value,
          { colId: '$new', rowIndex: 2 },
        ]);
        notCalledExcept(actions, ['drillDown']);
      });
      it('adds the new element to the sub element', function () {
        const child = rowNode.data.hadronDocument.getChild([
          'field0',
          'field1',
        ]);
        expect(child.nextElement.currentKey).to.equal('$new');
        expect(rowNode.data.hadronDocument.generateObject()).to.deep.equal({
          _id: '1',
          field0: { field1: 'value', $new: '' },
        });
      });
    });

    describe('add array element to array', function () {
      const context = getContext(['field0']);
      const actions = getActions();
      before(function (done) {
        rowNode = getNode({ field0: ['value0', 'value1', 'value2'] });
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
            context={context}
          />
        );
        const wrapper = component.find({
          'data-testid': 'add-element-to-array',
        });
        expect(wrapper).to.be.present();
        wrapper.simulate('click');
        done();
      });
      it('calls drillDown action', function () {
        expect(actions.drillDown.callCount).to.equal(1);
        expect(actions.drillDown.args[0]).to.deep.equal([
          rowNode.data.hadronDocument,
          value,
          { colId: 3, rowIndex: 2 },
        ]);
        notCalledExcept(actions, ['drillDown']);
      });
      it('adds the new element to the sub element', function () {
        const child = rowNode.data.hadronDocument.getChild(['field0']);
        expect(child.elements.lastElement.currentKey).to.equal(3);
        expect(rowNode.data.hadronDocument.generateObject()).to.deep.equal({
          _id: '1',
          field0: ['value0', 'value1', 'value2', ''],
        });
      });
    });
  });
});
