import React from 'react';
import type { ComponentProps } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'chai';
import sinon from 'sinon';
import type { SinonSpy } from 'sinon';
import QueryBar from './query-bar';
import { Provider } from '../stores/context';
import { configureStore } from '../stores/query-bar-store';
import type { QueryBarExtraArgs, RootState } from '../stores/query-bar-store';
import { toggleQueryOptions } from '../stores/query-bar-reducer';
import type { PreferencesAccess } from 'compass-preferences-model';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';
import { mapQueryToFormFields } from '../utils/query';
import { DEFAULT_FIELD_VALUES } from '../constants/query-bar-store';
import { PreferencesProvider } from 'compass-preferences-model/provider';
import { createNoopLoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';
import {
  FavoriteQueryStorageProvider,
  RecentQueryStorageProvider,
} from '@mongodb-js/my-queries-storage/provider';
import {
  compassFavoriteQueryStorageAccess,
  compassRecentQueryStorageAccess,
} from '@mongodb-js/my-queries-storage';

const noop = () => {
  /* no op */
};

const exportToLanguageButtonId = 'query-bar-open-export-to-language-button';
const queryHistoryButtonId = 'query-history-button';
const queryHistoryComponentTestId = 'query-history';

describe('QueryBar Component', function () {
  let preferences: PreferencesAccess;
  let onApplySpy: SinonSpy;
  let onResetSpy: SinonSpy;

  const renderQueryBar = (
    {
      expanded = false,
      ...props
    }: Partial<ComponentProps<typeof QueryBar>> & { expanded?: boolean } = {},
    storeOptions: Partial<RootState['queryBar']> = {}
  ) => {
    const store = configureStore(storeOptions, {
      preferences,
      logger: createNoopLoggerAndTelemetry(),
    } as QueryBarExtraArgs);
    store.dispatch(toggleQueryOptions(expanded));

    render(
      <PreferencesProvider value={preferences}>
        <FavoriteQueryStorageProvider value={compassFavoriteQueryStorageAccess}>
          <RecentQueryStorageProvider value={compassRecentQueryStorageAccess}>
            <Provider store={store}>
              <QueryBar
                buttonLabel="Apply"
                onApply={noop}
                onReset={noop}
                showExportToLanguageButton
                resultId="123"
                {...props}
              />
            </Provider>
          </RecentQueryStorageProvider>
        </FavoriteQueryStorageProvider>
      </PreferencesProvider>
    );
  };

  beforeEach(async function () {
    preferences = await createSandboxFromDefaultPreferences();
    onApplySpy = sinon.spy();
    onResetSpy = sinon.spy();
  });

  afterEach(cleanup);

  describe('when rendered', function () {
    beforeEach(function () {
      renderQueryBar({
        onApply: onApplySpy,
        onReset: onResetSpy,
        showExportToLanguageButton: true,
      });
    });

    it('renders the filter input', function () {
      const filterInput = screen.getByTestId('query-bar-option-filter-input');
      expect(filterInput).to.exist;
      expect(filterInput).to.have.attribute(
        'id',
        'query-bar-option-input-filter'
      );

      const queryInputs = screen.getAllByRole('textbox');
      expect(queryInputs.length).to.equal(1);
    });

    it('renders the query history button', function () {
      const queryHistoryButton = screen.queryByTestId(queryHistoryButtonId);
      expect(queryHistoryButton).to.be.visible;
    });

    it('does not render the query history popover', function () {
      const queryHistory = screen.queryByTestId(queryHistoryComponentTestId);
      expect(queryHistory).to.not.exist;
    });
  });

  describe('when expanded', function () {
    beforeEach(function () {
      renderQueryBar({
        expanded: true,
        onApply: onApplySpy,
        onReset: onResetSpy,
      });
    });

    it('renders the expanded inputs', function () {
      const queryInputs = screen.getAllByRole('textbox');
      expect(queryInputs.length).to.equal(8);
    });
  });

  describe('with one query option', function () {
    beforeEach(function () {
      renderQueryBar({
        queryOptionsLayout: ['project'],
        expanded: true,
        onApply: onApplySpy,
        onReset: onResetSpy,
      });
    });

    it('renders the expanded inputs', function () {
      const queryInputs = screen.getAllByRole('textbox');
      expect(queryInputs.length).to.equal(2);
    });
  });

  describe('with ai enabled', function () {
    beforeEach(async function () {
      await preferences.savePreferences({
        enableGenAIFeatures: true,
        cloudFeatureRolloutAccess: {
          GEN_AI_COMPASS: true,
        },
      });
    });

    describe('with filter content supplied', function () {
      beforeEach(function () {
        renderQueryBar(
          {
            queryOptionsLayout: ['filter'],
          },
          {
            fields: mapQueryToFormFields(
              {},
              {
                ...DEFAULT_FIELD_VALUES,
                filter: { a: 2 },
              }
            ),
          }
        );
      });

      it('renders the ai entry button', function () {
        expect(screen.getByText('Generate query')).to.exist;
        expect(screen.getByTestId('ai-experience-query-entry-button')).to.exist;
      });
    });

    describe('without filter content supplied', function () {
      beforeEach(function () {
        renderQueryBar({
          queryOptionsLayout: ['filter'],
        });
      });

      it('does not render the ai entry button, but renders the placeholder', function () {
        expect(screen.getByText('Generate query')).to.exist;
        expect(screen.queryByTestId('ai-experience-query-entry-button')).to.not
          .exist;
      });
    });
  });

  describe('with two query options', function () {
    beforeEach(function () {
      renderQueryBar({
        queryOptionsLayout: ['project', 'sort'],
        expanded: true,
        onApply: onApplySpy,
        onReset: onResetSpy,
      });
    });

    it('renders the expanded inputs', function () {
      const queryInputs = screen.getAllByRole('textbox');
      expect(queryInputs.length).to.equal(3);
    });
  });

  describe('when showExportToLanguageButton is false', function () {
    beforeEach(function () {
      renderQueryBar({
        showExportToLanguageButton: false,
      });
    });

    it('does not render the exportToLanguage button', function () {
      const exportToLanguageButton = screen.queryByTestId(
        exportToLanguageButtonId
      );
      expect(exportToLanguageButton).to.not.exist;
    });
  });

  describe('with three query options', function () {
    beforeEach(function () {
      renderQueryBar({
        queryOptionsLayout: ['project', 'sort', 'collation'],
        expanded: true,
        onApply: onApplySpy,
        onReset: onResetSpy,
      });
    });

    it('renders the expanded inputs', function () {
      const queryInputs = screen.getAllByRole('textbox');
      expect(queryInputs.length).to.equal(4);
    });
  });

  describe('with four query options', function () {
    beforeEach(function () {
      renderQueryBar({
        queryOptionsLayout: ['project', 'sort', ['collation', 'limit']],
        expanded: true,
        onApply: onApplySpy,
        onReset: onResetSpy,
      });
    });

    it('renders the expanded inputs', function () {
      const queryInputs = screen.getAllByRole('textbox');
      expect(queryInputs.length).to.equal(5);
    });
  });

  describe('when the query history button is clicked', function () {
    beforeEach(function () {
      renderQueryBar();

      const button = screen.getByTestId(queryHistoryButtonId);
      button.click();
    });

    it('renders the query history popover', function () {
      const queryHistory = screen.getByTestId(queryHistoryComponentTestId);
      expect(queryHistory).to.be.visible;
    });
  });

  describe('tab navigation', function () {
    beforeEach(function () {
      renderQueryBar();
    });

    it('should not allow tabbing through the input to the apply button', function () {
      const queryHistoryButton = screen.getByTestId(queryHistoryButtonId);
      const applyButton = screen.getByTestId('query-bar-apply-filter-button');

      queryHistoryButton.focus();
      userEvent.tab();
      userEvent.tab();
      userEvent.tab();

      expect(
        applyButton.ownerDocument.activeElement === screen.getByRole('textbox')
      ).to.equal(true);
    });
  });
});
