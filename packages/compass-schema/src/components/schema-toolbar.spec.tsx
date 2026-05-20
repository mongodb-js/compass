import type { ComponentProps } from 'react';
import React from 'react';
import { render, screen, userEvent } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import sinon from 'sinon';
import type { AllPreferences } from 'compass-preferences-model';
import { SchemaToolbar } from './schema-toolbar';
import QueryBarPlugin from '@mongodb-js/compass-query-bar';
import {
  createElectronFavoriteQueryStorage,
  createElectronRecentQueryStorage,
} from '@mongodb-js/my-queries-storage/electron';

const MockQueryBarPlugin = QueryBarPlugin.withMockServices({
  dataService: {
    sample() {
      return Promise.resolve([]);
    },
    getConnectionString() {
      return { hosts: [] } as any;
    },
  } as any,
  instance: { on() {}, removeListener() {} } as any,
  favoriteQueryStorageAccess: {
    getStorage: () =>
      createElectronFavoriteQueryStorage({ basepath: '/tmp/test' }),
  },
  recentQueryStorageAccess: {
    getStorage: () =>
      createElectronRecentQueryStorage({ basepath: '/tmp/test' }),
  },
  atlasAiService: {} as any,
  collection: {
    fetchMetadata: () => Promise.resolve({} as any),
  } as any,
});

const testErrorMessage =
  'An error occurred during schema analysis: test error msg';
const exportSchemaTestId = 'open-schema-export-button';

describe('SchemaToolbar', function () {
  const renderSchemaToolbar = (
    props: Partial<ComponentProps<typeof SchemaToolbar>> = {},
    preferences: Partial<AllPreferences> = {}
  ) => {
    const queryBarProps = {};
    render(
      <MockQueryBarPlugin {...(queryBarProps as any)}>
        <SchemaToolbar
          analysisState="complete"
          error={undefined}
          isOutdated={false}
          onAnalyzeSchemaClicked={() => {}}
          onResetClicked={() => {}}
          sampleSize={10}
          schemaResultId="123"
          onExportSchemaClicked={() => {}}
          setShowLegacyExportTooltip={() => {}}
          showLegacyExportTooltip={false}
          onDismissError={() => {}}
          maxDistinctFields={1000}
          onSetMaxDistinctFields={() => {}}
          showLimitOverride={false}
          {...props}
        />
      </MockQueryBarPlugin>,
      {
        preferences,
      }
    );
  };

  afterEach(function () {
    sinon.restore();
  });

  describe('errors', function () {
    it('renders general error', function () {
      renderSchemaToolbar({
        analysisState: 'initial',
        error: {
          errorType: 'general',
          errorMessage: 'test error msg',
        },
      });

      expect(screen.getByText(testErrorMessage)).to.be.visible;
      expect(screen.getByTestId('schema-toolbar-error-message')).to.be.visible;
    });

    it('renders timeout error', function () {
      renderSchemaToolbar({
        analysisState: 'initial',
        error: {
          errorType: 'timeout',
          errorMessage: 'test error msg',
        },
      });

      expect(screen.getByTestId('schema-toolbar-timeout-message')).to.be
        .visible;
      expect(
        screen.getByTestId('schema-toolbar-timeout-message').textContent
      ).to.include('Please try increasing the maxTimeMS');
    });

    it('renders complexity abort banner referencing the threshold at the time of the error', function () {
      renderSchemaToolbar({
        analysisState: 'initial',
        error: {
          errorType: 'highComplexity',
          errorMessage: 'test',
          fieldThreshold: 2500,
        },
        maxDistinctFields: 5000,
      });

      const banner = screen.getByTestId(
        'schema-toolbar-complexity-abort-message'
      );
      expect(banner).to.be.visible;
      expect(banner.textContent).to.include('2500');
      expect(banner.textContent).not.to.include('5000');
      expect(
        screen.getByRole('link', { name: 'Learn more' })
      ).to.have.attribute(
        'href',
        'https://www.mongodb.com/docs/manual/data-modeling/design-antipatterns/bloated-documents/'
      );
    });
  });

  describe('max distinct fields input', function () {
    it('is not rendered by default', function () {
      renderSchemaToolbar();
      expect(screen.queryByTestId('schema-max-fields-input')).to.not.exist;
    });

    it('is rendered when highComplexity error occurs', function () {
      renderSchemaToolbar({
        error: { errorType: 'highComplexity', errorMessage: 'test' },
      });
      expect(screen.getByTestId('schema-max-fields-input')).to.be.visible;
    });

    it('is rendered when showLimitOverride is true even without an active error', function () {
      renderSchemaToolbar({ showLimitOverride: true });
      expect(screen.getByTestId('schema-max-fields-input')).to.be.visible;
    });

    it('dispatches onSetMaxDistinctFields on blur with a valid value', function () {
      const onSetMaxDistinctFields = sinon.stub();
      renderSchemaToolbar({
        onSetMaxDistinctFields,
        error: { errorType: 'highComplexity', errorMessage: 'test' },
      });
      const input = screen.getByTestId('schema-max-fields-input');

      userEvent.clear(input);
      userEvent.type(input, '5000');
      userEvent.tab();

      expect(onSetMaxDistinctFields).to.have.been.calledOnceWith(5000);
    });

    it('does not dispatch on blur for out-of-range values', function () {
      const onSetMaxDistinctFields = sinon.stub();
      renderSchemaToolbar({
        onSetMaxDistinctFields,
        error: { errorType: 'highComplexity', errorMessage: 'test' },
      });
      const input = screen.getByTestId('schema-max-fields-input');

      userEvent.clear(input);
      userEvent.type(input, '500');
      userEvent.tab();

      expect(onSetMaxDistinctFields).not.to.have.been.called;
    });

    it('shows an error message while the value is below the minimum', function () {
      renderSchemaToolbar({
        error: { errorType: 'highComplexity', errorMessage: 'test' },
      });
      const input = screen.getByTestId('schema-max-fields-input');

      userEvent.clear(input);
      userEvent.type(input, '500');

      expect(input).to.have.attribute('aria-invalid', 'true');
      expect(screen.getByText('Must be between 1000 and 10000')).to.be.visible;
    });

    it('shows an error message while the value exceeds the maximum', function () {
      renderSchemaToolbar({
        error: { errorType: 'highComplexity', errorMessage: 'test' },
      });
      const input = screen.getByTestId('schema-max-fields-input');

      userEvent.clear(input);
      userEvent.type(input, '20000');

      expect(input).to.have.attribute('aria-invalid', 'true');
      expect(screen.getByText('Must be between 1000 and 10000')).to.be.visible;
    });

    it('clears the error state when a valid value is entered', function () {
      renderSchemaToolbar({
        error: { errorType: 'highComplexity', errorMessage: 'test' },
      });
      const input = screen.getByTestId('schema-max-fields-input');

      userEvent.clear(input);
      userEvent.type(input, '500');
      expect(input).to.have.attribute('aria-invalid', 'true');

      userEvent.clear(input);
      userEvent.type(input, '5000');
      expect(input).not.to.have.attribute('aria-invalid', 'true');
    });
  });

  it('renders the sample size count', function () {
    renderSchemaToolbar({
      sampleSize: 123123,
    });

    expect(screen.getByTestId('schema-document-count').textContent).to.include(
      '123123'
    );
    expect(screen.getByText(/This report is based on a sample of/)).to.be
      .visible;
    expect(screen.getByText('123123')).to.be.visible;
    expect(screen.getByText(/documents/)).to.be.visible;
  });

  it('renders the sample size count non-plural', function () {
    renderSchemaToolbar({
      sampleSize: 1,
    });

    expect(screen.queryByText(/documents/)).to.not.exist;
  });

  it('renders the query bar role', function () {
    renderSchemaToolbar();
    expect(screen.getByTestId('query-bar')).to.be.visible;
  });

  it('renders the export schema button', function () {
    renderSchemaToolbar({
      sampleSize: 100,
    });

    expect(screen.getByTestId(exportSchemaTestId)).to.be.visible;
  });
});
