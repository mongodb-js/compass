import React from 'react';
import { expect } from 'chai';

import {
  render,
  cleanup,
  screen,
  userEvent,
} from '@mongodb-js/testing-library-compass';

import {
  getNode,
  getApi,
  getColumn,
  getActions,
  getColumnApi,
  getContext,
} from '../../../test/aggrid-helper';
import AddFieldButton from './add-field-button';

function renderButtonAndOpenMenu(props) {
  const actions = getActions();
  const api = getApi();
  const column = getColumn('field1', { headerName: 'field1', colId: 'field1' });
  const columnApi = getColumnApi([]);
  const context = getContext([]);
  const defaultProps = {
    api: api,
    column: column,
    addColumn: actions.addColumn,
    drillDown: actions.drillDown,
    columnApi: columnApi,
    context: context,
  };

  render(<AddFieldButton {...defaultProps} {...props} />);

  userEvent.click(screen.getByRole('button', { name: 'Add field' }));
}

describe('<AddFieldButton />', function () {
  afterEach(cleanup);

  it('renders actions for an object', function () {
    const rowNode = getNode({ field1: { subfield1: 'value' } });
    const value = rowNode.data.hadronDocument.get('field1');
    renderButtonAndOpenMenu({ rowNode, value });

    expect(screen.queryByTestId('add-field-after')).to.exist;
    expect(screen.queryByTestId('add-child-to-object')).to.exist;
    expect(screen.queryByTestId('add-element-to-array')).to.not.exist;
  });

  it('renders actions for an array', function () {
    const rowNode = getNode({ field1: ['item1', 'item2'] });
    const value = rowNode.data.hadronDocument.get('field1');
    renderButtonAndOpenMenu({ rowNode, value });

    expect(screen.queryByTestId('add-field-after')).to.exist;
    expect(screen.queryByTestId('add-child-to-object')).to.not.exist;
    expect(screen.queryByTestId('add-element-to-array')).to.exist;
  });

  it('renders actions for a non expandable value', function () {
    const rowNode = getNode({ field1: 'value' });
    const value = rowNode.data.hadronDocument.get('field1');
    renderButtonAndOpenMenu({ rowNode, value });

    expect(screen.queryByTestId('add-field-after')).to.exist;
    expect(screen.queryByTestId('add-child-to-object')).to.not.exist;
    expect(screen.queryByTestId('add-element-to-array')).to.not.exist;
  });

  describe('add next field actions', function () {
    it('clicking add-field-after calls addColumn action at top level', function () {
      const actions = getActions();
      const column = getColumn('field1', {
        headerName: 'field1',
        colId: 'field1',
      });
      const columnApi = getColumnApi([]);
      const context = getContext([]);
      const rowNode = getNode({ field1: 'value', field3: 'value3' });
      const value = rowNode.data.hadronDocument.get('field1');

      render(
        <AddFieldButton
          column={column}
          node={rowNode}
          value={value}
          addColumn={actions.addColumn}
          drillDown={actions.drillDown}
          columnApi={columnApi}
          displace={20}
          context={context}
        />
      );

      userEvent.click(screen.getByRole('button', { name: 'Add field' }));
      userEvent.click(screen.getByTestId('add-field-after'));

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
    });

    it('clicking add-field-after adds element after current element', function () {
      const actions = getActions();
      const column = getColumn('field1', {
        headerName: 'field1',
        colId: 'field1',
      });
      const columnApi = getColumnApi([]);
      const context = getContext([]);
      const rowNode = getNode({ field1: 'value', field3: 'value3' });
      const value = rowNode.data.hadronDocument.get('field1');

      render(
        <AddFieldButton
          column={column}
          node={rowNode}
          value={value}
          addColumn={actions.addColumn}
          drillDown={actions.drillDown}
          columnApi={columnApi}
          displace={20}
          context={context}
        />
      );

      userEvent.click(screen.getByRole('button', { name: 'Add field' }));
      userEvent.click(screen.getByTestId('add-field-after'));

      expect(value.nextElement.currentKey).to.equal('$new');
    });

    it('clicking add-field-after in nested object view calls addColumn correctly', function () {
      const actions = getActions();
      const column = getColumn('field1', {
        headerName: 'field1',
        colId: 'field1',
      });
      const columnApi = getColumnApi([]);
      const context = getContext(['field0']);
      const rowNode = getNode({ field0: { field1: 'value' } });
      const value = rowNode.data.hadronDocument.getChild(['field0', 'field1']);

      render(
        <AddFieldButton
          column={column}
          node={rowNode}
          value={value}
          addColumn={actions.addColumn}
          drillDown={actions.drillDown}
          columnApi={columnApi}
          displace={20}
          context={context}
        />
      );

      userEvent.click(screen.getByRole('button', { name: 'Add field' }));
      userEvent.click(screen.getByTestId('add-field-after'));

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
      expect(value.nextElement.currentKey).to.equal('$new');
    });
  });

  describe('add element to object actions', function () {
    it('clicking add-child-to-object calls drillDown action', function () {
      const actions = getActions();
      const column = getColumn('field0', {
        headerName: 'field0',
        colId: 'field0',
      });
      const columnApi = getColumnApi([]);
      const context = getContext([]);
      const rowNode = getNode({ field0: { field1: 'value' } });
      const value = rowNode.data.hadronDocument.get('field0');

      render(
        <AddFieldButton
          column={column}
          node={rowNode}
          value={value}
          addColumn={actions.addColumn}
          drillDown={actions.drillDown}
          columnApi={columnApi}
          displace={20}
          context={context}
        />
      );

      userEvent.click(screen.getByRole('button', { name: 'Add field' }));
      userEvent.click(screen.getByTestId('add-child-to-object'));

      expect(actions.drillDown.callCount).to.equal(1);
      expect(actions.drillDown.args[0][0]).to.equal(
        rowNode.data.hadronDocument
      );
      expect(actions.drillDown.args[0][1]).to.equal(value);
      expect(actions.drillDown.args[0][2]).to.deep.equal({
        colId: '$new',
        rowIndex: 2,
      });

      const child = rowNode.data.hadronDocument.getChild(['field0', 'field1']);
      expect(child.nextElement.currentKey).to.equal('$new');
    });
  });

  describe('add element to array actions', function () {
    it('clicking add-element-to-array calls drillDown action', function () {
      const actions = getActions();
      const column = getColumn('field0', {
        headerName: 'field0',
        colId: 'field0',
      });
      const columnApi = getColumnApi([]);
      const context = getContext([]);
      const rowNode = getNode({ field0: ['value0', 'value1', 'value2'] });
      const value = rowNode.data.hadronDocument.get('field0');

      render(
        <AddFieldButton
          column={column}
          node={rowNode}
          value={value}
          addColumn={actions.addColumn}
          drillDown={actions.drillDown}
          columnApi={columnApi}
          displace={20}
          context={context}
        />
      );

      userEvent.click(screen.getByRole('button', { name: 'Add field' }));
      userEvent.click(screen.getByTestId('add-element-to-array'));

      expect(actions.drillDown.callCount).to.equal(1);
      expect(actions.drillDown.args[0][0]).to.equal(
        rowNode.data.hadronDocument
      );
      expect(actions.drillDown.args[0][1]).to.equal(value);
      expect(actions.drillDown.args[0][2]).to.deep.equal({
        colId: 3,
        rowIndex: 2,
      });

      const child = rowNode.data.hadronDocument.getChild(['field0']);
      expect(child.elements.lastElement.currentKey).to.equal(3);
    });
  });
});
