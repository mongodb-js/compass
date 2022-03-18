import React from 'react';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { expect } from 'chai';
import type { Store } from 'redux';

import type { RootState } from '../../modules';
import configureStore from '../../stores/store';
import Aggregations from '../aggregations';
import { DATA_SERVICE_CONNECTED } from '../../modules/data-service';

const mockDataService = class {
  aggregate() {
    return {
      toArray: () => Promise.resolve([{ id: 1 }]),
    };
  }
};

const initialShowNewToolbarValue =
  process.env.COMPASS_SHOW_NEW_AGGREGATION_TOOLBAR;

describe('PipelineToolbar', function () {
  describe('renders toolbar', function () {
    let toolbar: HTMLElement;
    beforeEach(function () {
      process.env.COMPASS_SHOW_NEW_AGGREGATION_TOOLBAR = 'true';
      const store = configureStore({});
      render(
        <Provider store={store}>
          <Aggregations />
        </Provider>
      );
      toolbar = screen.getByTestId('pipeline-toolbar');
    });

    afterEach(function () {
      process.env.COMPASS_SHOW_NEW_AGGREGATION_TOOLBAR =
        initialShowNewToolbarValue;
    });

    it('renders toolbar', function () {
      expect(toolbar, 'should render toolbar').to.exist;
    });

    it('renders toolbar header', function () {
      const header = within(toolbar).getByTestId('pipeline-header');
      expect(header).to.exist;

      expect(within(header).getByText('Pipeline'), 'shows pipeline text').to
        .exist;
      expect(
        within(header).getByTestId('pipeline-toolbar-open-pipelines-button'),
        'shows open saved pipelines button'
      ).to.exist;

      expect(
        within(header).getByTestId('toolbar-pipeline-stages'),
        'shows pipeline stages'
      ).to.exist;

      expect(
        within(header).getByTestId('pipeline-toolbar-run-button'),
        'shows run pipeline button'
      ).to.exist;
      expect(
        within(header).getByTestId('pipeline-toolbar-options-button'),
        'shows more options button'
      ).to.exist;
    });

    it('renders toolbar options', function () {
      // Click the options toggle
      userEvent.click(
        within(toolbar).getByTestId('pipeline-toolbar-options-button')
      );
      const options = within(toolbar).getByTestId('pipeline-options');
      expect(options).to.exist;

      expect(
        within(options).getByTestId('collation-toolbar-input-label'),
        'shows collation'
      ).to.exist;
    });

    it('renders toolbar settings', function () {
      const settings = within(toolbar).getByTestId('pipeline-settings');
      expect(settings).to.exist;

      expect(within(settings).getByTestId('pipeline-name'), 'shows name').to
        .exist;

      expect(
        within(settings)
          .getByTestId('pipeline-name')
          .textContent.trim()
          .toLowerCase(),
        'shows untitled as default name'
      ).to.equal('untitled');

      expect(within(settings).getByTestId('save-menu'), 'shows save menu').to
        .exist;

      expect(
        within(settings).getByTestId('create-new-menu'),
        'shows create-new menu'
      ).to.exist;
      expect(
        within(settings).getByTestId('pipeline-toolbar-export-button'),
        'shows export to language button'
      ).to.exist;

      expect(
        within(settings).getByTestId('pipeline-toolbar-preview-toggle'),
        'shows auto-preview toggle'
      ).to.exist;
      expect(
        within(settings).getByTestId('pipeline-toolbar-settings-button'),
        'shows settings button'
      ).to.exist;
    });

    it('renders menus', function () {
      const settings = within(toolbar).getByTestId('pipeline-settings');

      userEvent.click(within(settings).getByTestId('save-menu'));
      const saveMenuContent = screen.getByTestId('save-menu-content');
      expect(saveMenuContent.childNodes[0].textContent).to.equal('Save');
      expect(saveMenuContent.childNodes[1].textContent).to.equal('Save as');
      expect(saveMenuContent.childNodes[2].textContent).to.equal('Create view');

      userEvent.click(within(settings).getByTestId('create-new-menu'));
      const createNewMenuContent = screen.getByTestId(
        'create-new-menu-content'
      );
      expect(createNewMenuContent.childNodes[0].textContent).to.equal(
        'Pipeline'
      );
      expect(createNewMenuContent.childNodes[1].textContent).to.equal(
        'Pipeline from text'
      );
    });
  });

  describe('toolbar actions', function () {
    let toolbar: HTMLElement;
    let store: Store<RootState>;
    beforeEach(function () {
      process.env.COMPASS_SHOW_NEW_AGGREGATION_TOOLBAR = 'true';
      store = configureStore({});
      store.dispatch({
        type: DATA_SERVICE_CONNECTED,
        dataService: new mockDataService(),
      });
      render(
        <Provider store={store}>
          <Aggregations />
        </Provider>
      );
      toolbar = screen.getByTestId('pipeline-toolbar');
    });

    afterEach(function () {
      process.env.COMPASS_SHOW_NEW_AGGREGATION_TOOLBAR =
        initialShowNewToolbarValue;
    });

    it('opens saved pipelines', function () {
      userEvent.click(
        within(toolbar).getByTestId('pipeline-toolbar-open-pipelines-button')
      );
      expect(screen.getByTestId('saved-pipelines')).to.exist;
    });

    it('runs pipeline', async function () {
      userEvent.click(
        within(toolbar).getByTestId('pipeline-toolbar-run-button')
      );
      await waitFor(() => Promise.resolve(true));
      expect(
        screen.getByTestId('pipeline-results-workspace'),
        'shows results workspace'
      ).to.exist;
      expect(
        screen.getByTestId('pipeline-toolbar-edit-button'),
        'show edit after query is run'
      ).to.exist;
    });

    it('edits pipeline', async function () {
      userEvent.click(
        within(toolbar).getByTestId('pipeline-toolbar-run-button')
      );
      await waitFor(() => Promise.resolve(true));
      userEvent.click(
        within(toolbar).getByTestId('pipeline-toolbar-edit-button')
      );
      expect(
        screen.getByTestId('pipeline-builder-workspace'),
        'shows builder workspace'
      ).to.exist;
    });

    it('opens save pipeline modal', function () {
      userEvent.click(within(toolbar).getByTestId('save-menu'));
      const menuContent = screen.getByTestId('save-menu-content');
      userEvent.click(within(menuContent).getByLabelText('Save'));
      expect(screen.getByTestId('save_pipeline_modal')).to.exist;
    });

    it('opens save as pipeline modal', function () {
      userEvent.click(within(toolbar).getByTestId('save-menu'));
      const menuContent = screen.getByTestId('save-menu-content');
      userEvent.click(within(menuContent).getByLabelText('Save as'));
      expect(screen.getByTestId('save_pipeline_modal')).to.exist;
    });

    // todo: CreateViewModal is opened in another plugin using a different redux store.
    it.skip('opens create view modal', function () {
      userEvent.click(within(toolbar).getByTestId('save-menu'));
      const menuContent = screen.getByTestId('save-menu-content');
      userEvent.click(within(menuContent).getByLabelText('Create view'));
      expect(screen.getByTestId('create_view_modal')).to.exist;
    });

    it('opens confirmation modal when creating a new pipeline', function () {
      userEvent.click(within(toolbar).getByTestId('create-new-menu'));
      const menuContent = screen.getByTestId('create-new-menu-content');
      userEvent.click(within(menuContent).getByLabelText('Pipeline'));
      expect(screen.getByTestId('confirm_new_pipeline_modal')).to.exist;
    });

    it('opens import modal when creating a new pipeline from text', function () {
      userEvent.click(within(toolbar).getByTestId('create-new-menu'));
      const menuContent = screen.getByTestId('create-new-menu-content');
      userEvent.click(within(menuContent).getByLabelText('Pipeline from text'));
      expect(screen.getByTestId('import_pipeline_modal')).to.exist;
    });

    // todo: Export to language is also opened differently.
    it.skip('opens export modal', function () {
      userEvent.click(
        within(toolbar).getByTestId('pipeline-toolbar-export-button')
      );
      expect(screen.getByTestId('export-to-lang-modal')).to.exist;
    });

    it('toggles auto-preview', function () {
      const initialAutoPreview = store.getState().autoPreview;
      userEvent.click(
        within(toolbar).getByTestId('pipeline-toolbar-preview-toggle')
      );
      expect(store.getState().autoPreview).to.not.equal(initialAutoPreview);
    });

    it('opens pipeline settings', function () {
      userEvent.click(
        within(toolbar).getByTestId('pipeline-toolbar-settings-button')
      );
      expect(screen.getByTestId('pipeline-sidebar-settings')).to.exist;
    });
  });
});
