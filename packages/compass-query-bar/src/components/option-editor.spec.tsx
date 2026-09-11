import React from 'react';
import { expect } from 'chai';
import {
  cleanup,
  render,
  screen,
  waitFor,
  userEvent,
  fireEvent,
} from '@mongodb-js/testing-library-compass';
import { OptionEditor, getOptionBasedQueries } from './option-editor';
import type { SinonSpy } from 'sinon';
import { applyFromHistory } from '../stores/query-bar-reducer';
import sinon from 'sinon';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';
import { DocumentList } from '@mongodb-js/compass-components';
import { PreferencesProvider } from 'compass-preferences-model/provider';

class MockPasteEvent extends window.Event {
  private text: string;
  constructor(text: string) {
    super('paste', { bubbles: true, cancelable: true });
    this.text = text;
  }
  clipboardData = {
    getData: () => {
      return this.text;
    },
  };
}

async function renderOptionEditor(
  props: Partial<React.ComponentProps<typeof OptionEditor>> = {}
) {
  const preferencesAccess = await createSandboxFromDefaultPreferences();
  return render(
    <PreferencesProvider value={preferencesAccess}>
      <OptionEditor
        optionName="filter"
        namespace="test.test"
        insertEmptyDocOnFocus
        onChange={() => {}}
        onUnsafeInteger={() => {}}
        value=""
        recentQueries={[]}
        favoriteQueries={[]}
        onApplyQuery={applyFromHistory}
        {...props}
      ></OptionEditor>
    </PreferencesProvider>
  );
}

describe('OptionEditor', function () {
  beforeEach(function () {
    if ((process as any).type === 'renderer') {
      // Skipping due to COMPASS-7103
      this.skip();
    }
  });

  afterEach(function () {
    cleanup();
  });

  describe('with autofix enabled', function () {
    it('fills the input with an empty object "{}" when empty on focus', async function () {
      await renderOptionEditor();

      expect(screen.getByRole('textbox').textContent).to.eq('');

      userEvent.click(screen.getByRole('textbox'));

      await waitFor(() => {
        expect(screen.getByRole('textbox').textContent).to.eq('{}');
      });
    });

    it('does not change input value when empty on focus', async function () {
      await renderOptionEditor({
        value: '{ foo: 1 }',
      });

      expect(screen.getByRole('textbox').textContent).to.eq('{ foo: 1 }');

      userEvent.click(screen.getByRole('textbox'));

      await waitFor(() => {
        expect(screen.getByRole('textbox').textContent).to.eq('{ foo: 1 }');
      });
    });

    it('should adjust pasted query if pasting over empty brackets with the cursor in the middle', async function () {
      await renderOptionEditor();

      userEvent.tab();

      await waitFor(() => {
        expect(screen.getByRole('textbox').textContent).to.eq('{}');
      });

      screen
        .getByRole('textbox')
        .dispatchEvent(new MockPasteEvent('{ foo: 1 }'));

      await waitFor(() => {
        expect(screen.getByRole('textbox').textContent).to.eq('{ foo: 1 }');
      });
    });

    it('should not modify user text whe pasting when cursor moved', async function () {
      await renderOptionEditor();

      userEvent.tab();

      await waitFor(() => {
        expect(screen.getByRole('textbox').textContent).to.eq('{}');
      });

      userEvent.keyboard('{arrowright}');

      screen
        .getByRole('textbox')
        .dispatchEvent(new MockPasteEvent('{ foo: 1 }'));

      await waitFor(() => {
        expect(screen.getByRole('textbox').textContent).to.eq('{}{ foo: 1 }');
      });
    });

    it('should not modify user text when pasting in empty input', async function () {
      await renderOptionEditor();

      userEvent.tab();
      userEvent.keyboard('{arrowright}{backspace}{backspace}{backspace}');

      screen
        .getByRole('textbox')
        .dispatchEvent(new MockPasteEvent('{ foo: 1 }'));

      await waitFor(() => {
        expect(screen.getByRole('textbox').textContent).to.eq('{ foo: 1 }');
      });
    });
  });

  describe('when rendering filter option', function () {
    let onApplySpy: SinonSpy;

    beforeEach(async function () {
      onApplySpy = sinon.spy();
      await renderOptionEditor({
        onApplyQuery: onApplySpy,
        recentQueries: [
          {
            _lastExecuted: new Date(),
            filter: { a: 1 },
          },
        ],
        favoriteQueries: [
          {
            _lastExecuted: new Date(),
            filter: { a: 2 },
            sort: { a: -1 },
          },
        ],
      });

      userEvent.click(screen.getByRole('textbox'));
      await waitFor(() => {
        screen.getByLabelText('Completions');
      });
    });

    it('renders autocomplete options', function () {
      expect(screen.getAllByText('{ a: 1 }')[0]).to.be.visible;
      expect(screen.getByText('{ a: 2 }, sort: { a: -1 }')).to.be.visible;
    });

    it('calls onApply with correct params', async function () {
      // Simulate selecting the autocomplete option
      userEvent.click(screen.getByText('{ a: 2 }, sort: { a: -1 }'));
      await waitFor(() => {
        expect(onApplySpy.lastCall).to.be.calledWithExactly(
          {
            filter: { a: 2 },
            sort: { a: -1 },
          },
          []
        );
      });
    });
  });

  describe('when rendering project option', function () {
    let onApplySpy: SinonSpy;

    beforeEach(async function () {
      onApplySpy = sinon.spy();
      await renderOptionEditor({
        optionName: 'project',
        onApplyQuery: onApplySpy,
        recentQueries: [
          {
            _lastExecuted: new Date(),
            project: { a: 1 },
          },
        ],
        favoriteQueries: [
          {
            _lastExecuted: new Date(),
            project: { a: 0 },
            sort: { a: -1 },
          },
        ],
      });
      userEvent.click(screen.getByRole('textbox'));
      await waitFor(() => {
        screen.getByLabelText('Completions');
      });
    });

    it('renders autocomplete options', function () {
      expect(screen.getAllByText('project: { a: 1 }')[0]).to.be.visible;
      expect(screen.getAllByText('project: { a: 0 }')[0]).to.be.visible;
    });

    it('calls onApply with correct params', async function () {
      // Simulate selecting the autocomplete option
      userEvent.click(screen.getByText('project: { a: 0 }'));
      await waitFor(() => {
        expect(onApplySpy).to.have.been.calledOnceWithExactly(
          {
            project: { a: 0 },
          },
          ['filter', 'collation', 'sort', 'hint', 'skip', 'limit', 'maxTimeMS']
        );
      });
    });
  });

  describe('getOptionBasedQueries', function () {
    const savedQueries = [
      {
        _lastExecuted: new Date(),
        filter: { a: 1 },
        project: { b: 1 },
        sort: { c: 1 },
        collation: { locale: 'en' },
        hint: { a: 1 },
        skip: 1,
        limit: 1,
      },
    ];

    it('filters out update queries', function () {
      const queries = getOptionBasedQueries('filter', 'recent', [
        ...savedQueries,
        { _lastExecuted: new Date(), update: { a: 1 }, filter: { a: 2 } },
      ]);
      expect(queries.length).to.equal(1);
    });

    it('filters out empty queries', function () {
      const queries = getOptionBasedQueries('filter', 'recent', [
        ...savedQueries,
        { _lastExecuted: new Date() },
      ]);
      expect(queries.length).to.equal(1);
    });

    it('filters out duplicate queries', function () {
      const queries = getOptionBasedQueries('filter', 'recent', [
        ...savedQueries,
        ...savedQueries,
        ...savedQueries,
        { _lastExecuted: new Date() },
        { _lastExecuted: new Date() },
      ]);
      expect(queries.length).to.equal(1);
    });

    const optionNames = [
      'filter',
      'project',
      'sort',
      'collation',
      'hint',
    ] as const;
    for (const name of optionNames) {
      it(`maps query for ${name}`, function () {
        const queries = getOptionBasedQueries(name, 'recent', savedQueries);

        // For filter, we include all the query properties and for the rest
        // we only include that specific option.
        const queryProperties =
          name === 'filter'
            ? Object.fromEntries(
                Object.entries(savedQueries[0]).filter(
                  ([key]) => key !== '_lastExecuted'
                )
              )
            : {
                [name]: savedQueries[0][name],
              };

        expect(queries).to.deep.equal([
          {
            lastExecuted: savedQueries[0]._lastExecuted,
            queryProperties,
            type: 'recent',
          },
        ]);
      });
    }
  });

  describe('dropping a field dragged from the document list', function () {
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
      // Built with the same helper the document list uses, so that the two
      // sides of the drag cannot drift apart.
      DocumentList.setDraggedDocumentField(
        dataTransfer as unknown as DataTransfer,
        { field, value }
      );
      return dataTransfer;
    }

    it('adds the dropped field to the filter', async function () {
      const onFilterChange = sinon.spy();
      await renderOptionEditor({ onFilterChange });

      fireEvent.drop(screen.getByRole('textbox'), {
        dataTransfer: dataTransferWithField('customer.address.city', 'London'),
      });

      expect(onFilterChange).to.have.been.calledOnceWith({
        type: 'addDistinctValue',
        payload: { field: 'customer.address.city', value: 'London' },
      });
    });

    it('accepts the drag so that the browser delivers the drop', async function () {
      const onFilterChange = sinon.spy();
      await renderOptionEditor({ onFilterChange });

      const dataTransfer = dataTransferWithField('status', 'shipped');
      const dragOver = fireEvent.dragOver(screen.getByRole('textbox'), {
        dataTransfer,
      });

      // fireEvent returns false when a handler called preventDefault, which is
      // what tells the browser this is a valid drop target.
      expect(dragOver).to.equal(false);
      expect(dataTransfer.dropEffect).to.equal('copy');
    });

    it('ignores drops that did not come from the document list', async function () {
      const onFilterChange = sinon.spy();
      await renderOptionEditor({ onFilterChange });

      fireEvent.drop(screen.getByRole('textbox'), {
        dataTransfer: {
          types: ['text/plain'],
          getData: () => 'some pasted text',
        },
      });

      expect(onFilterChange).to.not.have.been.called;
    });

    it('does not accept dropped fields on query options other than the filter', async function () {
      const onFilterChange = sinon.spy();
      await renderOptionEditor({ optionName: 'sort', onFilterChange });

      fireEvent.drop(screen.getByRole('textbox'), {
        dataTransfer: dataTransferWithField('status', 'shipped'),
      });

      expect(onFilterChange).to.not.have.been.called;
    });
  });
});
