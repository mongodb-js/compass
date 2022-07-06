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
      localAppRegistry={localAppRegistry}
      explainResultId="123"
      explainErrorMessage={undefined}
      onExecuteExplainClicked={() => {}}
      onExportToLanguageClicked={() => {}}
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

  it('calls the click handler when the export to language is clicked', function () {
    const onExportToLanguageClickedSpy = sinon.spy();

    renderExplainToolbar({
      onExportToLanguageClicked: onExportToLanguageClickedSpy,
    });

    expect(onExportToLanguageClickedSpy.called).to.be.false;
    userEvent.click(screen.getByRole('button'));

    expect(onExportToLanguageClickedSpy.calledOnce).to.be.true;
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
