import React from 'react';
import { expect } from 'chai';
import {
  cleanup,
  render,
  screen,
  waitFor,
  userEvent,
} from '@mongodb-js/testing-library-compass';
import { OptionEditor, getOptionBasedQueries } from './option-editor';
import type { SinonSpy } from 'sinon';
import { applyFromHistory } from '../stores/query-bar-reducer';
import sinon from 'sinon';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';
import type { PreferencesAccess } from 'compass-preferences-model';
import { PreferencesProvider } from 'compass-preferences-model/provider';
import type { RecentQuery } from '@mongodb-js/my-queries-storage';

class MockPasteEvent extends window.Event {
  constructor(private text: string) {
    super('paste', { bubbles: true, cancelable: true });
  }
  clipboardData = {
    getData: () => {
      return this.text;
    },
  };
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
      render(
        <OptionEditor
          optionName="filter"
          namespace="test.test"
          insertEmptyDocOnFocus
          onChange={() => {}}
          value=""
          savedQueries={[]}
          onApplyQuery={applyFromHistory}
        ></OptionEditor>
      );

      expect(screen.getByRole('textbox').textContent).to.eq('');

      userEvent.click(screen.getByRole('textbox'));

      await waitFor(() => {
        expect(screen.getByRole('textbox').textContent).to.eq('{}');
      });
    });

    it('does not change input value when empty on focus', async function () {
      render(
        <OptionEditor
          optionName="filter"
          namespace="test.test"
          insertEmptyDocOnFocus
          onChange={() => {}}
          value="{ foo: 1 }"
          savedQueries={[]}
          onApplyQuery={applyFromHistory}
        ></OptionEditor>
      );

      expect(screen.getByRole('textbox').textContent).to.eq('{ foo: 1 }');

      userEvent.click(screen.getByRole('textbox'));

      await waitFor(() => {
        expect(screen.getByRole('textbox').textContent).to.eq('{ foo: 1 }');
      });
    });

    it('should adjust pasted query if pasting over empty brackets with the cursor in the middle', async function () {
      render(
        <OptionEditor
          optionName="filter"
          namespace="test.test"
          insertEmptyDocOnFocus
          onChange={() => {}}
          value=""
          savedQueries={[]}
          onApplyQuery={applyFromHistory}
        ></OptionEditor>
      );

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
      render(
        <OptionEditor
          optionName="filter"
          namespace="test.test"
          insertEmptyDocOnFocus
          onChange={() => {}}
          value=""
          savedQueries={[]}
          onApplyQuery={applyFromHistory}
        ></OptionEditor>
      );

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
      render(
        <OptionEditor
          optionName="filter"
          namespace="test.test"
          insertEmptyDocOnFocus
          onChange={() => {}}
          value=""
          savedQueries={[]}
          onApplyQuery={applyFromHistory}
        ></OptionEditor>
      );

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
    let preferencesAccess: PreferencesAccess;

    beforeEach(async function () {
      preferencesAccess = await createSandboxFromDefaultPreferences();
      onApplySpy = sinon.spy();
      render(
        <PreferencesProvider value={preferencesAccess}>
          <OptionEditor
            optionName="filter"
            namespace="test.test"
            insertEmptyDocOnFocus
            onChange={() => {}}
            value=""
            savedQueries={[
              {
                type: 'recent',
                lastExecuted: new Date(),
                queryProperties: {
                  filter: { a: 1 },
                },
              },
              {
                type: 'favorite',
                lastExecuted: new Date(),
                queryProperties: {
                  filter: { a: 2 },
                  sort: { a: -1 },
                },
              },
            ]}
            onApplyQuery={onApplySpy}
          />
        </PreferencesProvider>
      );
      userEvent.click(screen.getByRole('textbox'));
      await waitFor(() => {
        screen.getByLabelText('Completions');
      });
    });

    afterEach(function () {
      cleanup();
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
    let preferencesAccess: PreferencesAccess;

    beforeEach(async function () {
      preferencesAccess = await createSandboxFromDefaultPreferences();
      onApplySpy = sinon.spy();
      render(
        <PreferencesProvider value={preferencesAccess}>
          <OptionEditor
            optionName="project"
            namespace="test.test"
            insertEmptyDocOnFocus
            onChange={() => {}}
            value=""
            savedQueries={[
              {
                type: 'favorite',
                lastExecuted: new Date(),
                queryProperties: {
                  project: { a: 1 },
                },
              },
              {
                type: 'recent',
                lastExecuted: new Date(),
                queryProperties: {
                  project: { a: 0 },
                },
              },
            ]}
            onApplyQuery={onApplySpy}
          />
        </PreferencesProvider>
      );
      userEvent.click(screen.getByRole('textbox'));
      await waitFor(() => {
        screen.getByLabelText('Completions');
      });
    });

    afterEach(function () {
      cleanup();
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
    ] as unknown as RecentQuery[];

    it('filters out update queries', function () {
      const queries = getOptionBasedQueries('filter', 'recent', [
        ...savedQueries,
        { _lastExecuted: new Date(), update: { a: 1 }, filter: { a: 2 } },
      ] as unknown as RecentQuery[]);
      expect(queries.length).to.equal(1);
    });

    it('filters out empty queries', function () {
      const queries = getOptionBasedQueries('filter', 'recent', [
        ...savedQueries,
        { _lastExecuted: new Date() },
      ] as unknown as RecentQuery[]);
      expect(queries.length).to.equal(1);
    });

    it('filters out duplicate queries', function () {
      const queries = getOptionBasedQueries('filter', 'recent', [
        ...savedQueries,
        ...savedQueries,
        ...savedQueries,
        { _lastExecuted: new Date() },
        { _lastExecuted: new Date() },
      ] as unknown as RecentQuery[]);
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
            type: 'recent',
            lastExecuted: savedQueries[0]._lastExecuted,
            queryProperties,
          },
        ]);
      });
    }
  });
});
