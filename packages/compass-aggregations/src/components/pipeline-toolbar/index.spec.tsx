import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { expect } from 'chai';

import configureStore from '../../stores/store';
import { PipelineToolbar } from './index';

describe('PipelineToolbar', function () {
  describe('renders with setting row - visible', function () {
    let toolbar: HTMLElement;
    beforeEach(function () {
      render(
        <Provider store={configureStore({})}>
          <PipelineToolbar
            isSettingsVisible={true}
            showExportButton={true}
            showRunButton={true}
          />
        </Provider>
      );
      toolbar = screen.getByTestId('pipeline-toolbar');
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

  describe('renders with setting row - hidden', function () {
    it('does not render toolbar settings', function () {
      render(
        <Provider store={configureStore({})}>
          <PipelineToolbar isSettingsVisible={false} />
        </Provider>
      );
      const toolbar = screen.getByTestId('pipeline-toolbar');
      expect(() => within(toolbar).getByTestId('pipeline-settings')).to.throw;
    });
  });
});
