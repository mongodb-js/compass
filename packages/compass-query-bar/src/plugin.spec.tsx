import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { expect } from 'chai';
import AppRegistry from 'hadron-app-registry';
import QueryBarPlugin from './plugin';
import configureStore from './stores';
import Sinon from 'sinon';
import userEvent from '@testing-library/user-event';
import preferencesAccess from 'compass-preferences-model';

const mockQueryHistoryRole = {
  name: 'Query History',
  // eslint-disable-next-line react/display-name
  component: () => <div>Query history</div>,
  configureStore: () => ({}),
  configureActions: () => {},
  storeName: 'Query.History',
  actionName: 'Query.History.Actions',
};

const fakeAppInstanceStore = {
  getState: function () {
    return {
      instance: {
        on() {},
      },
    };
  },
} as any;

describe('QueryBar [Plugin]', function () {
  let store: ReturnType<typeof configureStore>;

  const globalAppRegistry = new AppRegistry();
  globalAppRegistry.registerRole('Query.QueryHistory', mockQueryHistoryRole);

  globalAppRegistry.registerStore('App.InstanceStore', fakeAppInstanceStore);

  const localAppRegistry = new AppRegistry();
  localAppRegistry.registerStore('Query.History', {
    onActivated: () => {},
  });
  localAppRegistry.registerAction('Query.History.Actions', {
    actions: true,
  });

  beforeEach(function () {
    store = configureStore({
      globalAppRegistry,
      localAppRegistry,
    });
  });

  afterEach(cleanup);

  describe('when find is clicked', function () {
    const onApply = Sinon.spy();

    beforeEach(function () {
      render(<QueryBarPlugin store={store} onApply={onApply} />);
      expect(onApply).to.be.not.called;
      userEvent.click(screen.getByTestId('query-bar-apply-filter-button'));
    });

    it('it calls the onApply prop', function () {
      expect(onApply).to.have.been.calledOnce;
    });
  });

  describe('when the plugin is rendered with or without a query history button', function () {
    let enableSavedAggregationsQueries: boolean;

    before(function () {
      enableSavedAggregationsQueries =
        preferencesAccess.getPreferences().enableSavedAggregationsQueries;
    });

    after(async function () {
      await preferencesAccess.savePreferences({
        enableSavedAggregationsQueries,
      });
    });

    it('query history button renders when saved queries are enabled', async function () {
      await preferencesAccess.savePreferences({
        enableSavedAggregationsQueries: true,
      });
      render(<QueryBarPlugin store={store} />);
      expect(screen.getByTestId('query-history-button')).to.exist;
    });

    it('query history button does not render when ssaved queries are disabled', async function () {
      await preferencesAccess.savePreferences({
        enableSavedAggregationsQueries: false,
      });
      render(<QueryBarPlugin store={store} />);
      expect(screen.queryByTestId('query-history-button')).to.not.exist;
    });
  });

  describe('when rendered with or without an export to language button', function () {
    it('export to language button renders by default', function () {
      render(<QueryBarPlugin store={store} showExportToLanguageButton />);
      expect(screen.getByTestId('query-bar-open-export-to-language-button')).to
        .exist;
    });

    it('export to language button renders when showExportToLanguageButton prop is passed and set to true', function () {
      render(<QueryBarPlugin store={store} showExportToLanguageButton />);
      expect(screen.getByTestId('query-bar-open-export-to-language-button')).to
        .exist;
    });

    it('export to language button does not render when showExportToLanguageButton prop is passed and set to false', function () {
      render(
        <QueryBarPlugin store={store} showExportToLanguageButton={false} />
      );
      expect(screen.queryByTestId('query-bar-open-export-to-language-button'))
        .to.not.exist;
    });
  });

  describe('a user is able to provide custom placeholders for the input fields', function () {
    const queryOptionsLayout: any[] = [
      'project',
      ['sort', 'maxTimeMS'],
      ['collation', 'skip', 'limit'],
    ];

    it('the input fields have a placeholder by default', function () {
      render(
        <QueryBarPlugin store={store} queryOptionsLayout={queryOptionsLayout} />
      );

      userEvent.click(screen.getByTestId('query-bar-options-toggle'));

      // getByText for ace editor that doesn't use actual placeholder attr
      expect(screen.getByText(/Type a query: { field: 'value' }/)).to.exist;
      expect(screen.getByText(/{ field: 0 }/)).to.exist;
      expect(screen.getByText(/{ field: -1 }/)).to.exist;
      expect(screen.getByText(/{ locale: 'simple' }/)).to.exist;

      // getByPlaceholderText for input elements
      expect(screen.getByPlaceholderText('60000')).to.exist;
      expect(
        // getAll because two inputs have the same label
        screen.getAllByPlaceholderText('0')
      ).to.exist;
    });

    it('the input fields placeholders can be modified', function () {
      render(
        <QueryBarPlugin
          store={store}
          queryOptionsLayout={queryOptionsLayout}
          placeholders={{
            filter: "{field: 'matchValue'}",
            project: '{field: 1}',
            collation: "{locale: 'fr' }",
            sort: '{field: -1}',
            skip: '10',
            limit: '20',
            maxTimeMS: '50000',
          }}
        />
      );

      userEvent.click(screen.getByTestId('query-bar-options-toggle'));

      expect(screen.getByText(/{field: 'matchValue'}/)).to.exist;
      expect(screen.getByText(/{field: 1}/)).to.exist;
      expect(screen.getByText(/{locale: 'fr' }/)).to.exist;
      expect(screen.getByText(/{field: -1}/)).to.exist;
      expect(screen.getByPlaceholderText('10')).to.exist;
      expect(screen.getByPlaceholderText('20')).to.exist;
      expect(screen.getByPlaceholderText('50000')).to.exist;
    });
  });
});
