import type { ComponentProps } from 'react';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';
import userEvent from '@testing-library/user-event';

import { ExplainToolbar } from './explain-toolbar';
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

const renderExplainToolbar = (
  props: Partial<ComponentProps<typeof ExplainToolbar>> = {}
) => {
  const localAppRegistry = new AppRegistry();
  localAppRegistry.registerRole('Query.QueryBar', mockQueryBarRole);
  localAppRegistry.registerStore(mockQueryBarRole.storeName, mockQueryBarStore);

  render(
    <ExplainToolbar
      globalAppRegistry={new AppRegistry()}
      localAppRegistry={localAppRegistry}
      explainResultId="123"
      explainErrorMessage={undefined}
      onExecuteExplainClicked={() => {}}
      showOutdatedWarning={false}
      showReadonlyWarning={false}
      switchToTreeView={() => {}}
      switchToJSONView={() => {}}
      viewType="tree"
      {...props}
    />
  );
};

describe('ExplainToolbar', function () {
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

    renderExplainToolbar({
      globalAppRegistry,
      localAppRegistry,
    });

    expect(globalAppRegistrySpy.called).to.be.false;
    expect(localAppRegistrySpy.called).to.be.false;
    // userEvent.click(screen.getByRole('Export to language').closest('button'));
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
      source: 'Explain',
    });
  });

  it('calls to change the view type when a different view type is chosen', function () {
    const switchToJSONViewSpy = sinon.spy();
    renderExplainToolbar({
      switchToJSONView: switchToJSONViewSpy,
    });

    expect(switchToJSONViewSpy.called).to.be.false;
    userEvent.click(screen.getByText('Raw Json'));

    expect(switchToJSONViewSpy.calledOnce).to.be.true;
  });

  it('renders an export to language button', function () {
    renderExplainToolbar();

    expect(screen.getByText('Export to language')).to.be.visible;
  });

  it('renders the query bar role', function () {
    renderExplainToolbar();

    expect(screen.getByText('Query bar')).to.be.visible;
  });
});
