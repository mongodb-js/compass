import React from 'react';
import {
  cleanup,
  screen,
  within,
  userEvent,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import { renderWithStore } from '../../../test/configure-store';
import { PipelineToolbar } from './index';
import { CompassPipelineStorage } from '@mongodb-js/my-queries-storage';

describe('PipelineToolbar', function () {
  describe('renders with setting row - visible', function () {
    let toolbar: HTMLElement;
    beforeEach(async function () {
      await renderWithStore(
        <PipelineToolbar
          isBuilderView
          showExportButton
          showRunButton
          showExplainButton
        />,
        { pipeline: [{ $match: { _id: 1 } }] },
        undefined,
        { pipelineStorage: new CompassPipelineStorage() }
      );
      toolbar = screen.getByTestId('pipeline-toolbar');
    });

    afterEach(cleanup);

    it('renders toolbar', function () {
      expect(toolbar, 'should render toolbar').to.exist;
    });

    it('renders toolbar header', function () {
      const header = within(toolbar).getByTestId('pipeline-header');
      expect(header).to.exist;

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
        'shows options button'
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
          ?.textContent?.trim()
          .toLowerCase(),
        'shows untitled as default name'
      ).to.equal('untitled');

      expect(
        within(settings).getByTestId('save-menu-show-actions'),
        'shows save menu'
      ).to.exist;

      expect(
        within(settings).getByTestId('pipeline-toolbar-create-new-button'),
        'shows create-new button'
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

      userEvent.click(within(settings).getByTestId('save-menu-show-actions'));
      const saveMenuContent = screen.getByTestId('save-menu');
      expect(saveMenuContent.childNodes[0].textContent).to.equal('Save');
      expect(saveMenuContent.childNodes[1].textContent).to.equal('Save as');
      expect(saveMenuContent.childNodes[2].textContent).to.equal('Create view');
    });
  });

  describe('renders with setting row - hidden', function () {
    it('does not render toolbar settings', async function () {
      await renderWithStore(
        <PipelineToolbar
          isBuilderView
          showExplainButton
          showExportButton
          showRunButton
        />
      );
      const toolbar = screen.getByTestId('pipeline-toolbar');
      expect(() => within(toolbar).getByTestId('pipeline-settings')).to.throw();
    });
  });
});
