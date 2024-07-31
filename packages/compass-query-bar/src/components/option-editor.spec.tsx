import React from 'react';
import { expect } from 'chai';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OptionEditor } from './option-editor';
import type { SinonSpy } from 'sinon';
import { applyFromHistory } from '../stores/query-bar-reducer';
import sinon from 'sinon';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';
import type { PreferencesAccess } from 'compass-preferences-model';
import { PreferencesProvider } from 'compass-preferences-model/provider';

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

  describe('when render filter bar with the query history autocompleter', function () {
    let onApplySpy: SinonSpy;
    let preferencesAccess: PreferencesAccess;

    beforeEach(async function () {
      preferencesAccess = await createSandboxFromDefaultPreferences();
      await preferencesAccess.savePreferences({
        enableQueryHistoryAutocomplete: true,
      });

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
              {
                type: 'recent',
                lastExecuted: new Date(),
                queryProperties: {
                  filter: { a: 2 },
                  sort: { a: -1 },
                  update: { a: 10 },
                },
              },
            ]}
            onApplyQuery={onApplySpy}
          />
        </PreferencesProvider>
      );
    });

    afterEach(function () {
      cleanup();
    });

    it('filter applied correctly when autocomplete option is clicked', async function () {
      userEvent.click(screen.getByRole('textbox'));
      await waitFor(() => {
        expect(screen.getAllByText('{ a: 1 }')[0]).to.be.visible;
        expect(screen.getByText('{ a: 2 }, sort: { a: -1 }')).to.be.visible;
        expect(
          screen.queryByText('{ a: 2 }, sort: { a: -1 }, update: { a: 10 }')
        ).to.be.null;
      });

      // Simulate selecting the autocomplete option
      userEvent.click(screen.getByText('{ a: 2 }, sort: { a: -1 }'));
      await waitFor(() => {
        expect(onApplySpy.lastCall).to.be.calledWithExactly({
          filter: { a: 2 },
          sort: { a: -1 },
        });
      });
    });
  });

  describe('when render project bar with the query history autocompleter', function () {
    let onApplySpy: SinonSpy;
    let preferencesAccess: PreferencesAccess;

    beforeEach(async function () {
      preferencesAccess = await createSandboxFromDefaultPreferences();
      await preferencesAccess.savePreferences({
        enableQueryHistoryAutocomplete: true,
      });

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
                type: 'favorite',
                lastExecuted: new Date(),
                queryProperties: {
                  filter: { a: 2 },
                  sort: { a: -1 },
                },
              },
              {
                type: 'recent',
                lastExecuted: new Date(),
                queryProperties: {
                  filter: { a: 2 },
                  sort: { a: -1 },
                  project: { a: 0 },
                },
              },
            ]}
            onApplyQuery={onApplySpy}
          />
        </PreferencesProvider>
      );
    });

    afterEach(function () {
      cleanup();
    });

    it('only queries with project property are shown in project editor', async function () {
      userEvent.click(screen.getByRole('textbox'));
      await waitFor(() => {
        expect(screen.getAllByText('project: { a: 1 }')[0]).to.be.visible;
        expect(screen.queryByText('{ a: 2 }, sort: { a: -1 }')).to.be.null;
        expect(screen.getByText('{ a: 2 }, sort: { a: -1 }, project: { a: 0 }'))
          .to.be.visible;
      });

      // Simulate selecting the autocomplete option
      userEvent.click(
        screen.getByText('{ a: 2 }, sort: { a: -1 }, project: { a: 0 }')
      );
      await waitFor(() => {
        expect(onApplySpy.lastCall).to.be.calledWithExactly({
          filter: { a: 2 },
          sort: { a: -1 },
          project: { a: 0 },
        });
      });
    });
  });
});
