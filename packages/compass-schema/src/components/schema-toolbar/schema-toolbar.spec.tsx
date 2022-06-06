import type { ComponentProps } from 'react';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';
import userEvent from '@testing-library/user-event';

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
    filterString: '',
    projectString: '',
    sortString: '',
    collationString: '',
    skipString: '',
    limitString: '',
    maxTimeMSString: '',
  },
};

const renderSchemaToolbar = (
  props: Partial<ComponentProps<typeof SchemaToolbar>> = {}
) => {
  const localAppRegistry = new AppRegistry();
  localAppRegistry.registerRole('Query.QueryBar', mockQueryBarRole);
  localAppRegistry.registerStore(mockQueryBarRole.storeName, mockQueryBarStore);

  render(
    <SchemaToolbar
      globalAppRegistry={new AppRegistry()}
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

  it('emits an app registry event when the export to language is clicked', function () {
    const globalAppRegistry = new AppRegistry();
    const localAppRegistry = new AppRegistry();
    const globalAppRegistrySpy = sinon.spy();
    const localAppRegistrySpy = sinon.spy();
    sinon.replace(globalAppRegistry, 'emit', globalAppRegistrySpy);
    sinon.replace(localAppRegistry, 'emit', localAppRegistrySpy);

    localAppRegistry.registerRole('Query.QueryBar', mockQueryBarRole);
    localAppRegistry.registerStore(
      mockQueryBarRole.storeName,
      mockQueryBarStore
    );

    renderSchemaToolbar({
      globalAppRegistry,
      localAppRegistry,
    });

    expect(globalAppRegistrySpy.called).to.be.false;
    expect(localAppRegistrySpy.called).to.be.false;
    userEvent.click(screen.getByRole('button'));

    expect(globalAppRegistrySpy.calledOnce).to.be.true;
    expect(localAppRegistrySpy.calledOnce).to.be.true;

    expect(localAppRegistrySpy.firstCall.args[0]).to.equal(
      'open-query-export-to-language'
    );
    expect(localAppRegistrySpy.firstCall.args[1]).to.deep.equal({
      filter: '',
      project: '',
      sort: '',
      collation: '',
      skip: '',
      limit: '',
      maxTimeMS: '',
    });

    expect(globalAppRegistrySpy.firstCall.args[0]).to.equal(
      'compass:export-to-language:opened'
    );
    expect(globalAppRegistrySpy.firstCall.args[1]).to.deep.equal({
      source: 'Schema',
    });
  });

  it("renders errors when they're passed", function () {
    renderSchemaToolbar({
      analysisState: 'error',
      errorMessage: 'test error msg',
    });

    expect(
      screen.getByText(
        'An error occurred during schema analysis: test error msg'
      )
    ).to.be.visible;
  });

  it('does not render errors when the analysis state is not error', function () {
    renderSchemaToolbar({
      errorMessage: 'test error msg',
    });

    expect(
      screen.queryByText(
        'An error occurred during schema analysis: test error msg'
      )
    ).to.not.exist;
  });

  it('renders an export to language button', function () {
    renderSchemaToolbar();

    expect(screen.getByText('Export to language')).to.be.visible;
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
