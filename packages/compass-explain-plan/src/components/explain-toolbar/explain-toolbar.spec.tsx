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
      hasExplainResults={false}
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

  it('calls to change the view type when a different view type is chosen', function () {
    const switchToJSONViewSpy = sinon.spy();
    renderExplainToolbar({
      switchToJSONView: switchToJSONViewSpy,
    });

    expect(switchToJSONViewSpy.called).to.be.false;
    userEvent.click(screen.getByText('Raw Json'));

    expect(switchToJSONViewSpy.calledOnce).to.be.true;
  });

  it('renders the query bar role', function () {
    renderExplainToolbar();

    expect(screen.getByText('Query bar')).to.be.visible;
  });
});
