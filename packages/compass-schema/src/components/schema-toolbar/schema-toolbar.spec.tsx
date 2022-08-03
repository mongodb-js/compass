import type { ComponentProps } from 'react';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';

import { SchemaToolbar } from './schema-toolbar';
import AppRegistry from 'hadron-app-registry';

const mockQueryBarRole = {
  name: 'Query Bar',
  // eslint-disable-next-line react/display-name
  component: () => <div>Query bar</div>,
  configureStore: () => ({}),
  configureActions: () => {},
  storeName: 'Query.Store',
  actionName: 'Query.Actions',
};

const mockQueryBarStore = {
  state: {
    filterString: '123',
    projectString: '',
    sortString: '',
    collationString: '',
    skipString: '',
    limitString: '',
    maxTimeMSString: '',
  },
};

const testErrorMessage =
  'An error occurred during schema analysis: test error msg';

const renderSchemaToolbar = (
  props: Partial<ComponentProps<typeof SchemaToolbar>> = {}
) => {
  const localAppRegistry = new AppRegistry();
  localAppRegistry.registerRole('Query.QueryBar', mockQueryBarRole);
  localAppRegistry.registerStore(mockQueryBarRole.storeName, mockQueryBarStore);

  render(
    <SchemaToolbar
      localAppRegistry={localAppRegistry}
      analysisState="complete"
      errorMessage={''}
      isOutdated={false}
      onAnalyzeSchemaClicked={() => {}}
      onResetClicked={() => {}}
      sampleSize={10}
      schemaResultId="123"
      {...props}
    />
  );
};

describe('SchemaToolbar', function () {
  afterEach(function () {
    sinon.restore();
  });

  it("renders errors when they're passed", function () {
    renderSchemaToolbar({
      analysisState: 'error',
      errorMessage: 'test error msg',
    });

    expect(screen.getByText(testErrorMessage)).to.be.visible;
    expect(screen.getByTestId('schema-toolbar-error-message')).to.be.visible;
  });

  it('does not render errors when the analysis state is not error', function () {
    renderSchemaToolbar({
      errorMessage: 'test error msg',
    });

    expect(screen.queryByText(testErrorMessage)).to.not.exist;
    expect(screen.queryByTestId('schema-toolbar-error-message')).to.not.exist;
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

    expect(screen.getByText('Query bar')).to.be.visible;
  });
});
