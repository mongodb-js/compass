import React from 'react';
import { expect } from 'chai';
import sinon from 'sinon';
import {
  render,
  screen,
  fireEvent,
  cleanup,
} from '@mongodb-js/testing-library-compass';
import { DocumentList } from '@mongodb-js/compass-components';
import { QueryBuilderPanel } from './query-builder-panel';
import type { BuilderState } from './builder-query';
import { EMPTY_BUILDER_STATE, compileBuilderState } from './builder-query';

/**
 * jsdom has no DataTransfer. This stands in for one, carrying a field the way
 * the document list does when a field name is dragged.
 */
function dataTransferWithField(field: string, value: unknown) {
  const store: Record<string, string> = Object.create(null) as Record<
    string,
    string
  >;
  const dataTransfer = {
    dropEffect: 'none',
    get types() {
      return Object.keys(store);
    },
    setData(type: string, data: string) {
      store[type] = data;
    },
    getData(type: string) {
      return store[type] ?? '';
    },
  };
  DocumentList.setDraggedDocumentField(
    dataTransfer as unknown as DataTransfer,
    { field, value }
  );
  return dataTransfer;
}

function renderPanel(state: Partial<BuilderState> = {}) {
  const onChange = sinon.spy();
  const onRun = sinon.spy();
  const fullState = { ...EMPTY_BUILDER_STATE, ...state };
  render(
    <QueryBuilderPanel
      state={fullState}
      onChange={onChange}
      onRun={onRun}
      errors={compileBuilderState(fullState).errors}
    />
  );
  return { onChange, onRun };
}

describe('QueryBuilderPanel', function () {
  afterEach(function () {
    cleanup();
  });

  describe('dropping a field', function () {
    it('accepts the drag so that the browser delivers the drop', function () {
      renderPanel();

      const dataTransfer = dataTransferWithField('status', 'shipped');
      const accepted = fireEvent.dragOver(
        screen.getByTestId('query-builder-query-drop-zone'),
        { dataTransfer }
      );

      // fireEvent returns false when a handler called preventDefault, which is
      // what marks this as a valid drop target.
      expect(accepted).to.equal(false);
      expect(dataTransfer.dropEffect).to.equal('copy');
    });

    it('adds a condition with the dropped field and value', function () {
      const { onChange } = renderPanel();

      fireEvent.drop(screen.getByTestId('query-builder-query-drop-zone'), {
        dataTransfer: dataTransferWithField('customer.address.city', 'London'),
      });

      expect(onChange).to.have.been.calledOnce;
      const next = onChange.firstCall.args[0] as BuilderState;
      expect(next.conditions).to.have.lengthOf(1);
      expect(next.conditions[0]).to.include({
        field: 'customer.address.city',
        operator: 'eq',
        valueText: "'London'",
        enabled: true,
      });
    });

    it('adds a projection row for a dropped field', function () {
      const { onChange } = renderPanel();

      fireEvent.drop(screen.getByTestId('query-builder-projection-drop-zone'), {
        dataTransfer: dataTransferWithField('timestamp', 1),
      });

      const next = onChange.firstCall.args[0] as BuilderState;
      expect(next.projections).to.have.lengthOf(1);
      expect(next.projections[0]).to.include({
        field: 'timestamp',
        mode: 'include',
        enabled: true,
      });
    });

    it('adds a sort row for a dropped field', function () {
      const { onChange } = renderPanel();

      fireEvent.drop(screen.getByTestId('query-builder-sort-drop-zone'), {
        dataTransfer: dataTransferWithField('timestamp', 1),
      });

      const next = onChange.firstCall.args[0] as BuilderState;
      expect(next.sorts).to.have.lengthOf(1);
      expect(next.sorts[0]).to.include({
        field: 'timestamp',
        direction: 'asc',
        enabled: true,
      });
    });

    it('keeps the rows already in the section', function () {
      const { onChange } = renderPanel({
        conditions: [
          {
            id: 'existing',
            field: 'status',
            operator: 'eq',
            valueText: "'shipped'",
            enabled: true,
          },
        ],
      });

      fireEvent.drop(screen.getByTestId('query-builder-query-drop-zone'), {
        dataTransfer: dataTransferWithField('total', 42),
      });

      const next = onChange.firstCall.args[0] as BuilderState;
      expect(next.conditions.map((c) => c.field)).to.deep.equal([
        'status',
        'total',
      ]);
    });

    it('ignores a drag that did not come from the document list', function () {
      const { onChange } = renderPanel();

      fireEvent.dragOver(screen.getByTestId('query-builder-query-drop-zone'), {
        dataTransfer: { types: ['text/plain'], getData: () => 'hello' },
      });
      fireEvent.drop(screen.getByTestId('query-builder-query-drop-zone'), {
        dataTransfer: { types: ['text/plain'], getData: () => 'hello' },
      });

      expect(onChange).to.not.have.been.called;
    });
  });

  describe('double-clicking a drop zone', function () {
    it('adds an empty condition row to fill in by hand', function () {
      const { onChange } = renderPanel();

      fireEvent.doubleClick(screen.getByTestId('query-builder-query-drop-zone'));

      const next = onChange.firstCall.args[0] as BuilderState;
      expect(next.conditions).to.have.lengthOf(1);
      expect(next.conditions[0]).to.include({ field: '', valueText: '' });
    });
  });

  describe('run', function () {
    it('calls onRun when Run is pressed', function () {
      const { onRun } = renderPanel();

      fireEvent.click(screen.getByText('Run'));

      expect(onRun).to.have.been.calledOnce;
    });
  });
});
