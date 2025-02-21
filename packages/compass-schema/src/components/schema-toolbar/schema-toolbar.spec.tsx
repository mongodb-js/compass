import type { ComponentProps } from 'react';
import React from 'react';
import { render, screen } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import sinon from 'sinon';
import type { AllPreferences } from 'compass-preferences-model';
import { SchemaToolbar } from './schema-toolbar';
import QueryBarPlugin from '@mongodb-js/compass-query-bar';
import {
  compassFavoriteQueryStorageAccess,
  compassRecentQueryStorageAccess,
} from '@mongodb-js/my-queries-storage';

const MockQueryBarPlugin = QueryBarPlugin.withMockServices({
  dataService: {
    sample() {
      return Promise.resolve([]);
    },
    getConnectionString() {
      return { hosts: [] } as any;
    },
  },
  instance: { on() {}, removeListener() {} } as any,
  favoriteQueryStorageAccess: compassFavoriteQueryStorageAccess,
  recentQueryStorageAccess: compassRecentQueryStorageAccess,
  atlasAiService: {} as any,
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
          onDismissError={() => {}}
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

    it('renders complexity abort error', function () {
      renderSchemaToolbar({
        analysisState: 'initial',
        error: {
          errorType: 'highComplexity',
          errorMessage: 'test error msg',
        },
      });

      expect(screen.getByTestId('schema-toolbar-complexity-abort-message')).to
        .be.visible;
      expect(
        screen.getByRole('link', { name: 'Learn more' })
      ).to.have.attribute(
        'href',
        'https://www.mongodb.com/docs/manual/data-modeling/design-antipatterns/bloated-documents/'
      );
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

  it('does not render the export schema button', function () {
    renderSchemaToolbar({
      sampleSize: 100,
    });
    expect(screen.getByText(/documents/)).to.be.visible;

    expect(screen.queryByTestId(exportSchemaTestId)).to.not.exist;
  });

  describe('when rendered with the enableExportSchema feature flag true', function () {
    beforeEach(function () {
      renderSchemaToolbar(
        {
          sampleSize: 100,
        },
        {
          enableExportSchema: true,
        }
      );
    });

    it('renders the export schema button', function () {
      expect(screen.getByTestId(exportSchemaTestId)).to.be.visible;
    });
  });
});
