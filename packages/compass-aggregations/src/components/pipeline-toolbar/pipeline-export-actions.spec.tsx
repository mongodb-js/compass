import React from 'react';
import {
  cleanup,
  screen,
  userEvent,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import { spy } from 'sinon';
import type { SinonSpy } from 'sinon';

import { renderWithStore } from '../../../test/configure-store';
import { PipelineExportActions } from './pipeline-export-actions';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';
import { PreferencesProvider } from 'compass-preferences-model/provider';

describe('PipelineExportActions', function () {
  describe('basic functionality', function () {
    let onExportToLanguageSpy: SinonSpy;
    let onExportDataSpy: SinonSpy;
    beforeEach(async function () {
      onExportToLanguageSpy = spy();
      onExportDataSpy = spy();
      await renderWithStore(
        <PipelineExportActions
          isExportToLanguageEnabled={true}
          isExportDataEnabled={true}
          onExportToLanguage={onExportToLanguageSpy}
          onExportData={onExportDataSpy}
        />
      );
    });

    afterEach(cleanup);

    it('calls onExportToLanguage callback when export code button is clicked', function () {
      const button = screen.getByText('Export Code');
      expect(button).to.be.visible;

      userEvent.click(button);

      expect(onExportToLanguageSpy.calledOnce).to.be.true;
    });

    it('calls onExportData callback when export data button is clicked', function () {
      const button = screen.getByText('Export Data');
      expect(button).to.be.visible;

      userEvent.click(button);

      expect(onExportDataSpy.calledOnce).to.be.true;
    });
  });

  describe('export data button visibility', function () {
    afterEach(cleanup);

    it('hides export data button when enableImportExport preference is disabled', async function () {
      const preferences = await createSandboxFromDefaultPreferences();
      await preferences.savePreferences({
        enableImportExport: false,
      });

      await renderWithStore(
        <PreferencesProvider value={preferences}>
          <PipelineExportActions
            isExportToLanguageEnabled={true}
            isExportDataEnabled={true}
            onExportToLanguage={() => {}}
            onExportData={() => {}}
          />
        </PreferencesProvider>
      );

      expect(screen.queryByTestId('pipeline-toolbar-export-data-button')).to.not
        .exist;
    });

    it('shows export data button when enableImportExport preference is enabled', async function () {
      const preferences = await createSandboxFromDefaultPreferences();
      await preferences.savePreferences({
        enableImportExport: true,
      });

      await renderWithStore(
        <PreferencesProvider value={preferences}>
          <PipelineExportActions
            isExportToLanguageEnabled={true}
            isExportDataEnabled={true}
            onExportToLanguage={() => {}}
            onExportData={() => {}}
          />
        </PreferencesProvider>
      );

      expect(screen.getByTestId('pipeline-toolbar-export-data-button')).to
        .exist;
    });
  });

  describe('export data button disabled state', function () {
    afterEach(cleanup);

    it('should hide export data button when isMergeOrOutPipeline is true', async function () {
      const preferences = await createSandboxFromDefaultPreferences();
      await preferences.savePreferences({
        enableImportExport: true,
      });

      await renderWithStore(
        <PreferencesProvider value={preferences}>
          <PipelineExportActions
            isExportToLanguageEnabled={true}
            isExportDataEnabled={false}
            isMergeOrOutPipeline
            onExportToLanguage={() => {}}
            onExportData={() => {}}
          />
        </PreferencesProvider>
      );

      // Button should not be rendered when isExportDataEnabled is false
      expect(screen.queryByTestId('pipeline-toolbar-export-data-button')).to.not
        .exist;
    });

    it('should disable export data button when isExportDataEnabled is false', async function () {
      const preferences = await createSandboxFromDefaultPreferences();
      await preferences.savePreferences({
        enableImportExport: true,
      });

      await renderWithStore(
        <PreferencesProvider value={preferences}>
          <PipelineExportActions
            isExportToLanguageEnabled={true}
            isExportDataEnabled={false}
            onExportToLanguage={() => {}}
            onExportData={() => {}}
          />
        </PreferencesProvider>
      );

      const button = screen.getByTestId('pipeline-toolbar-export-data-button');
      expect(button.getAttribute('aria-disabled')).to.equal('true');
    });

    it('should disable export code button when isExportToLanguageEnabled is false', async function () {
      const preferences = await createSandboxFromDefaultPreferences();
      await preferences.savePreferences({
        enableImportExport: true,
      });

      await renderWithStore(
        <PreferencesProvider value={preferences}>
          <PipelineExportActions
            isExportToLanguageEnabled={false}
            isExportDataEnabled={true}
            onExportToLanguage={() => {}}
            onExportData={() => {}}
          />
        </PreferencesProvider>
      );

      const button = screen.getByTestId('pipeline-toolbar-export-code-button');
      expect(button.getAttribute('aria-disabled')).to.equal('true');
    });

    it('should disable both export buttons when both are disabled', async function () {
      const preferences = await createSandboxFromDefaultPreferences();
      await preferences.savePreferences({
        enableImportExport: true,
      });

      await renderWithStore(
        <PreferencesProvider value={preferences}>
          <PipelineExportActions
            isExportToLanguageEnabled={false}
            isExportDataEnabled={false}
            onExportToLanguage={() => {}}
            onExportData={() => {}}
          />
        </PreferencesProvider>
      );

      // Export data button should be disabled.
      const dataButton = screen.getByTestId(
        'pipeline-toolbar-export-data-button'
      );
      expect(dataButton.getAttribute('aria-disabled')).to.equal('true');

      // Export code button should be disabled
      const codeButton = screen.getByTestId(
        'pipeline-toolbar-export-code-button'
      );
      expect(codeButton.getAttribute('aria-disabled')).to.equal('true');
    });
  });
});
