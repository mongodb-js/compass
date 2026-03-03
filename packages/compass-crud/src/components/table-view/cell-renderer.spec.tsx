import React from 'react';
import { expect } from 'chai';
import {
  render,
  screen,
  cleanup,
  userEvent,
} from '@mongodb-js/testing-library-compass';

import {
  getNode,
  getApi,
  getColumn,
  getActions,
  notCalledExcept,
  getContext,
} from '../../../test/aggrid-helper';
import CellRenderer from './cell-renderer';

describe('<CellRenderer />', function () {
  afterEach(cleanup);

  describe('#render', function () {
    const api = getApi();
    const column = getColumn();
    const actions = getActions();
    const context = getContext([]);

    describe('element is valid', function () {
      it('renders the element value correctly', function () {
        const rowNode = getNode({ field1: 'value' });
        const value = rowNode.data.hadronDocument.get('field1');
        render(
          <CellRenderer
            api={api as any}
            column={column as any}
            node={rowNode}
            value={value}
            drillDown={actions.drillDown}
            elementAdded={actions.elementAdded}
            elementRemoved={actions.elementRemoved}
            elementTypeChanged={actions.elementTypeChanged}
            tz="UTC"
            parentType=""
            context={context}
          />
        );
        expect(screen.getByText('"value"')).to.exist;
      });

      it('does not render the undo button', function () {
        const rowNode = getNode({ field1: 'value' });
        const value = rowNode.data.hadronDocument.get('field1');
        render(
          <CellRenderer
            api={api as any}
            column={column as any}
            node={rowNode}
            value={value}
            drillDown={actions.drillDown}
            elementAdded={actions.elementAdded}
            elementRemoved={actions.elementRemoved}
            elementTypeChanged={actions.elementTypeChanged}
            tz="UTC"
            parentType=""
            context={context}
          />
        );
        expect(screen.queryByLabelText('Expand')).to.not.exist;
      });
    });

    describe('element is added', function () {
      it('renders the cell as added with value and undo button', function () {
        const rowNode = getNode({});
        rowNode.data.hadronDocument.insertEnd('field1', 'value');
        const value = rowNode.data.hadronDocument.get('field1');
        const { container } = render(
          <CellRenderer
            api={api as any}
            column={column as any}
            node={rowNode}
            value={value}
            drillDown={actions.drillDown}
            elementAdded={actions.elementAdded}
            elementRemoved={actions.elementRemoved}
            elementTypeChanged={actions.elementTypeChanged}
            parentType=""
            tz="UTC"
            context={context}
          />
        );
        expect(screen.getByText('"value"')).to.exist;
        expect(container.querySelector('.table-view-cell-is-added')).to.exist;
        // Undo button should be present for added elements
        expect(screen.getByLabelText('Expand')).to.exist;
      });
    });

    describe('element is modified', function () {
      it('renders the element as modified with undo button', function () {
        const rowNode = getNode({ field1: 'value' });
        rowNode.data.hadronDocument.get('field1').edit('a new value');
        const value = rowNode.data.hadronDocument.get('field1');
        const { container } = render(
          <CellRenderer
            api={api as any}
            column={column as any}
            node={rowNode}
            value={value}
            drillDown={actions.drillDown}
            elementAdded={actions.elementAdded}
            elementRemoved={actions.elementRemoved}
            elementTypeChanged={actions.elementTypeChanged}
            parentType=""
            tz="UTC"
            context={context}
          />
        );
        expect(screen.getByText('"a new value"')).to.exist;
        expect(container.querySelector('.table-view-cell-is-edited')).to.exist;
        // Undo button should be present for modified elements
        expect(screen.getByLabelText('Expand')).to.exist;
      });
    });

    describe('element is removed', function () {
      it('renders the element as removed with undo button', function () {
        const rowNode = getNode({ field1: 'value' });
        rowNode.data.hadronDocument.get('field1').remove();
        const value = rowNode.data.hadronDocument.get('field1');
        const { container } = render(
          <CellRenderer
            api={api as any}
            column={column as any}
            node={rowNode}
            value={value}
            drillDown={actions.drillDown}
            elementAdded={actions.elementAdded}
            elementRemoved={actions.elementRemoved}
            elementTypeChanged={actions.elementTypeChanged}
            parentType=""
            tz="UTC"
            context={context}
          />
        );
        expect(container.querySelector('.table-view-cell-is-deleted')).to.exist;
        expect(screen.getByText('Deleted field')).to.exist;
        // Undo button should be present for removed elements
        expect(screen.getByLabelText('Expand')).to.exist;
      });
    });

    describe('element is invalid', function () {
      it('renders the element as invalid', function () {
        const rowNode = getNode({ field1: 'value' });
        rowNode.data.hadronDocument
          .get('field1')
          .setInvalid('invalid', 'String', 'message');
        const value = rowNode.data.hadronDocument.get('field1');
        const { container } = render(
          <CellRenderer
            api={api as any}
            column={column as any}
            node={rowNode}
            value={value}
            drillDown={actions.drillDown}
            elementAdded={actions.elementAdded}
            elementRemoved={actions.elementRemoved}
            elementTypeChanged={actions.elementTypeChanged}
            parentType=""
            tz="UTC"
            context={context}
          />
        );
        expect(container.querySelector('.table-view-cell-is-invalid')).to.exist;
        expect(screen.getByText('invalid')).to.exist;
      });
    });

    describe('element is empty', function () {
      it('renders the element as empty without undo button', function () {
        const rowNode = getNode({});
        const value = undefined;
        const { container } = render(
          <CellRenderer
            api={api as any}
            column={column as any}
            node={rowNode}
            value={value}
            drillDown={actions.drillDown}
            elementAdded={actions.elementAdded}
            elementRemoved={actions.elementRemoved}
            elementTypeChanged={actions.elementTypeChanged}
            parentType=""
            tz="UTC"
            context={context}
          />
        );
        expect(container.querySelector('.table-view-cell-is-empty')).to.exist;
        expect(screen.getByText('No field')).to.exist;
        // No undo button for empty elements
        expect(screen.queryByLabelText('Expand')).to.not.exist;
      });
    });

    describe('index of element is out of range', function () {
      it('renders the element as uneditable', function () {
        const rowNode = getNode({ array: [1, 2] });
        const value = undefined;
        const context2 = getContext(['array']);
        const column2 = getColumn(4);
        const { container } = render(
          <CellRenderer
            api={api as any}
            column={column2 as any}
            node={rowNode}
            value={value}
            drillDown={actions.drillDown}
            elementAdded={actions.elementAdded}
            elementRemoved={actions.elementRemoved}
            elementTypeChanged={actions.elementTypeChanged}
            parentType=""
            tz="UTC"
            context={context2}
          />
        );
        const uneditable = container.querySelector(
          '.table-view-cell-is-uneditable'
        );
        expect(uneditable).to.exist;
        expect(uneditable?.textContent).to.equal('');
        // No buttons for uneditable elements
        expect(screen.queryByLabelText('Expand')).to.not.exist;
      });
    });

    describe('parent type of element is incorrect', function () {
      it('is array, object expected - renders as uneditable', function () {
        const rowNode = getNode({ array: [1, 2] });
        const value = rowNode.data.hadronDocument.getChild(['array', 1]);
        const context2 = getContext(['array']);
        const column2 = getColumn(1);
        const { container } = render(
          <CellRenderer
            api={api as any}
            column={column2 as any}
            node={rowNode}
            value={value}
            drillDown={actions.drillDown}
            elementAdded={actions.elementAdded}
            elementRemoved={actions.elementRemoved}
            elementTypeChanged={actions.elementTypeChanged}
            context={context2}
            tz="UTC"
            parentType={'Object'}
          />
        );
        const uneditable = container.querySelector(
          '.table-view-cell-is-uneditable'
        );
        expect(uneditable).to.exist;
        expect(uneditable?.textContent).to.equal('');
        expect(screen.queryByLabelText('Expand')).to.not.exist;
      });

      it('is object, array expected - renders as uneditable', function () {
        const rowNode = getNode({ obj: { field1: 1, field2: 2 } });
        const value = rowNode.data.hadronDocument.getChild(['obj', 'field1']);
        const context2 = getContext(['obj']);
        const column2 = getColumn('field1');
        const { container } = render(
          <CellRenderer
            api={api as any}
            column={column2 as any}
            node={rowNode}
            value={value}
            drillDown={actions.drillDown}
            elementAdded={actions.elementAdded}
            elementRemoved={actions.elementRemoved}
            elementTypeChanged={actions.elementTypeChanged}
            context={context2}
            tz="UTC"
            parentType={'Array'}
          />
        );
        const uneditable = container.querySelector(
          '.table-view-cell-is-uneditable'
        );
        expect(uneditable).to.exist;
        expect(uneditable?.textContent).to.equal('');
        expect(screen.queryByLabelText('Expand')).to.not.exist;
      });
    });

    describe('element is expandable', function () {
      it('renders the element with expand button', function () {
        const rowNode = getNode({ field1: { subfield1: 1 } });
        const value = rowNode.data.hadronDocument.get('field1');
        render(
          <CellRenderer
            api={api}
            column={column}
            node={rowNode}
            value={value}
            drillDown={actions.drillDown}
            elementAdded={actions.elementAdded}
            elementRemoved={actions.elementRemoved}
            elementTypeChanged={actions.elementTypeChanged}
            parentType=""
            tz="UTC"
            context={context}
          />
        );
        expect(screen.getByText('{} 1 fields')).to.exist;
        // Expand button should be present for expandable elements
        expect(screen.getByLabelText('Expand')).to.exist;
      });
    });

    describe('element is array', function () {
      it('renders the element correctly', function () {
        const rowNode = getNode({ field1: [1, 2, 3] });
        const value = rowNode.data.hadronDocument.get('field1');
        render(
          <CellRenderer
            api={api}
            column={column}
            node={rowNode}
            value={value}
            drillDown={actions.drillDown}
            elementAdded={actions.elementAdded}
            elementRemoved={actions.elementRemoved}
            elementTypeChanged={actions.elementTypeChanged}
            parentType=""
            tz="UTC"
            context={context}
          />
        );
        expect(screen.getByText('[] 3 elements')).to.exist;
      });
    });

    describe('element is expandable and modified', function () {
      it('renders both undo and expand buttons', function () {
        const rowNode = getNode({ field1: { subfield1: 1 } });
        rowNode.data.hadronDocument
          .getChild(['field1', 'subfield1'])
          .edit('a new value');
        const value = rowNode.data.hadronDocument.get('field1');
        const { container } = render(
          <CellRenderer
            api={api}
            column={column}
            node={rowNode}
            value={value}
            drillDown={actions.drillDown}
            elementAdded={actions.elementAdded}
            elementRemoved={actions.elementRemoved}
            elementTypeChanged={actions.elementTypeChanged}
            parentType=""
            tz="UTC"
            context={context}
          />
        );
        // Both undo button (with left position) and expand button should be present
        expect(container.querySelector('.table-view-cell-circle-button-left'))
          .to.exist;
        expect(screen.getAllByLabelText('Expand')).to.have.length(2);
      });
    });
  });

  describe('#actions', function () {
    const column = getColumn();
    const context = getContext([]);

    describe('undo', function () {
      it('clicking undo on an element reverts it to original value', function () {
        const rowNode = getNode({ field1: 'value' });
        rowNode.data.hadronDocument.get('field1').edit('a new value');
        const value = rowNode.data.hadronDocument.get('field1');
        const api = getApi();
        const actions = getActions();
        const { container } = render(
          <CellRenderer
            api={api}
            column={column}
            node={rowNode}
            value={value}
            drillDown={actions.drillDown}
            elementAdded={actions.elementAdded}
            elementRemoved={actions.elementRemoved}
            elementTypeChanged={actions.elementTypeChanged}
            parentType=""
            tz="UTC"
            context={context}
          />
        );
        const undoButton = container.querySelector(
          '.table-view-cell-circle-button'
        );
        expect(undoButton).to.exist;
        userEvent.click(undoButton!, undefined, {
          skipPointerEventsCheck: true,
        });
        // After undo, element should not be modified
        expect(value.isModified()).to.equal(false);
        // Renders the original element
        expect(screen.getByText('"value"')).to.exist;
      });

      it('clicking undo on an added element calls elementRemoved action', function () {
        const rowNode = getNode({});
        rowNode.data.hadronDocument.insertEnd('field1', 'value');
        const value = rowNode.data.hadronDocument.get('field1');
        const api = getApi();
        const actions = getActions();
        const { container } = render(
          <CellRenderer
            api={api}
            column={column}
            node={rowNode}
            value={value}
            drillDown={actions.drillDown}
            elementAdded={actions.elementAdded}
            elementRemoved={actions.elementRemoved}
            elementTypeChanged={actions.elementTypeChanged}
            parentType=""
            tz="UTC"
            context={context}
          />
        );
        const undoButton = container.querySelector(
          '.table-view-cell-circle-button'
        );
        userEvent.click(undoButton!, undefined, {
          skipPointerEventsCheck: true,
        });
        expect(actions.elementRemoved.callCount).to.equal(1);
        expect(
          actions.elementRemoved.alwaysCalledWithExactly('field1', '1', false)
        ).to.equal(true);
        notCalledExcept(actions, ['elementRemoved']);
        notCalledExcept(api, []);
        // Renders an empty element
        expect(screen.getByText('No field')).to.exist;
      });

      it('clicking undo on a type changed element calls elementTypeChanged action', function () {
        const rowNode = getNode({ field1: 'value' });
        rowNode.data.hadronDocument.get('field1').edit(100);
        const value = rowNode.data.hadronDocument.get('field1');
        const api = getApi();
        const actions = getActions();
        const { container } = render(
          <CellRenderer
            api={api}
            column={column}
            node={rowNode}
            value={value}
            drillDown={actions.drillDown}
            elementAdded={actions.elementAdded}
            elementRemoved={actions.elementRemoved}
            elementTypeChanged={actions.elementTypeChanged}
            parentType=""
            tz="UTC"
            context={context}
          />
        );
        const undoButton = container.querySelector(
          '.table-view-cell-circle-button'
        );
        userEvent.click(undoButton!, undefined, {
          skipPointerEventsCheck: true,
        });
        expect(actions.elementTypeChanged.callCount).to.equal(1);
        expect(
          actions.elementTypeChanged.alwaysCalledWithExactly(
            'field1',
            'String',
            '1'
          )
        ).to.equal(true);
        notCalledExcept(actions, ['elementTypeChanged']);
        notCalledExcept(api, []);
        // Renders the original value
        expect(screen.getByText('"value"')).to.exist;
      });

      it('clicking undo on a removed element calls elementAdded action', function () {
        const rowNode = getNode({ field1: 'value' });
        rowNode.data.hadronDocument.get('field1').remove();
        const value = rowNode.data.hadronDocument.get('field1');
        const api = getApi();
        const actions = getActions();
        const { container } = render(
          <CellRenderer
            api={api}
            column={column}
            node={rowNode}
            value={value}
            drillDown={actions.drillDown}
            elementAdded={actions.elementAdded}
            elementRemoved={actions.elementRemoved}
            elementTypeChanged={actions.elementTypeChanged}
            parentType=""
            tz="UTC"
            context={context}
          />
        );
        const undoButton = container.querySelector(
          '.table-view-cell-circle-button'
        );
        userEvent.click(undoButton!, undefined, {
          skipPointerEventsCheck: true,
        });
        expect(actions.elementAdded.callCount).to.equal(1);
        expect(
          actions.elementAdded.alwaysCalledWithExactly('field1', 'String', '1')
        ).to.equal(true);
        notCalledExcept(actions, ['elementAdded']);
        notCalledExcept(api, []);
        // Renders the original value
        expect(screen.getByText('"value"')).to.exist;
      });
    });

    describe('drill down', function () {
      it('clicking expand button calls drillDown action', function () {
        const api = getApi();
        const actions = getActions();
        const rowNode = getNode({ field1: { subfield1: 1 } });
        const value = rowNode.data.hadronDocument.get('field1');
        const { container } = render(
          <CellRenderer
            api={api}
            column={column}
            node={rowNode}
            value={value}
            drillDown={actions.drillDown}
            elementAdded={actions.elementAdded}
            elementRemoved={actions.elementRemoved}
            elementTypeChanged={actions.elementTypeChanged}
            parentType=""
            tz="UTC"
            context={context}
          />
        );
        const expandButton = container.querySelector(
          '.table-view-cell-circle-button'
        );
        userEvent.click(expandButton!, undefined, {
          skipPointerEventsCheck: true,
        });
        expect(actions.drillDown.callCount).to.equal(1);
        expect(
          actions.drillDown.alwaysCalledWithExactly(
            rowNode.data.hadronDocument,
            value
          )
        ).to.equal(true);
        notCalledExcept(actions, ['drillDown']);
        notCalledExcept(api, []);
      });
    });

    describe('in non-editing mode', function () {
      it('clicking does not start editing', function () {
        const api = getApi();
        const actions = getActions();
        const rowNode = getNode({ field1: 'value' });
        const value = rowNode.data.hadronDocument.get('field1');
        const { container } = render(
          <CellRenderer
            api={api}
            column={column}
            node={rowNode}
            value={value}
            drillDown={actions.drillDown}
            elementAdded={actions.elementAdded}
            elementRemoved={actions.elementRemoved}
            elementTypeChanged={actions.elementTypeChanged}
            parentType=""
            tz="UTC"
            context={context}
          />
        );
        const cell = container.querySelector('.table-view-cell');
        userEvent.click(cell!, undefined, { skipPointerEventsCheck: true });
        notCalledExcept(actions, []);
        notCalledExcept(api, []);
      });
    });

    describe('in editing mode', function () {
      it('clicking starts editing', function () {
        const api = getApi();
        const actions = getActions();
        const rowNode = getNode({ field1: 'value' });
        rowNode.data.state = 'editing';
        const value = rowNode.data.hadronDocument.get('field1');
        const { container } = render(
          <CellRenderer
            api={api}
            column={column}
            node={rowNode}
            value={value}
            drillDown={actions.drillDown}
            elementAdded={actions.elementAdded}
            elementRemoved={actions.elementRemoved}
            elementTypeChanged={actions.elementTypeChanged}
            parentType=""
            tz="UTC"
            context={context}
          />
        );
        const cell = container.querySelector('.table-view-cell');
        userEvent.click(cell!, undefined, { skipPointerEventsCheck: true });
        expect(api.startEditingCell.callCount).to.equal(1);
        expect(
          api.startEditingCell.alwaysCalledWithExactly({
            rowIndex: 0,
            colKey: 'field1',
          })
        );
        notCalledExcept(actions, []);
        notCalledExcept(api, ['startEditingCell']);
      });
    });
  });
});
