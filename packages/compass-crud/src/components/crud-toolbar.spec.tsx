import React from 'react';
import { expect } from 'chai';
import sinon from 'sinon';
import AppRegistry from 'hadron-app-registry';
import { fireEvent, render, screen, cleanup } from '@testing-library/react';

import { CrudToolbar } from './crud-toolbar';

const noop = () => {
  /* noop */
};
const queryBarText = 'Query bar';
const mockQueryBarRole = {
  name: 'Query Bar',
  // eslint-disable-next-line react/display-name
  component: () => <div>{queryBarText}</div>,
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

function renderCrudToolbar(
  props?: Partial<React.ComponentProps<typeof CrudToolbar>>
) {
  const appRegistry = new AppRegistry();
  appRegistry.registerRole('Query.QueryBar', mockQueryBarRole);
  appRegistry.registerStore(mockQueryBarRole.storeName, mockQueryBarStore);

  return render(
    <CrudToolbar
      activeDocumentView="List"
      count={55}
      end={20}
      getPage={noop}
      insertDataHandler={noop}
      isExportable
      loadingCount={false}
      localAppRegistry={appRegistry}
      onApplyClicked={noop}
      onResetClicked={noop}
      openExportFileDialog={noop}
      page={0}
      readonly={false}
      refreshDocuments={noop}
      resultId="123"
      start={0}
      viewSwitchHandler={noop}
      {...props}
    />
  );
}

const addDataText = 'Add Data';

describe('CrudToolbar Component', function () {
  afterEach(function () {
    cleanup();
  });

  it('renders the query bar role', function () {
    renderCrudToolbar();

    expect(screen.getByText(queryBarText)).to.be.visible;
  });

  it('should not render the query bar role when isExportable is false', function () {
    renderCrudToolbar({
      isExportable: false,
    });

    expect(screen.queryByText(queryBarText)).to.not.exist;
  });

  it('call to change the document view type on click', function () {
    const viewSwitchHandlerSpy = sinon.spy();
    renderCrudToolbar({
      viewSwitchHandler: viewSwitchHandlerSpy,
    });

    expect(viewSwitchHandlerSpy.called).to.be.false;
    fireEvent.click(screen.getByTestId('toolbar-view-table'));

    expect(viewSwitchHandlerSpy.calledOnce).to.be.true;
    expect(viewSwitchHandlerSpy.firstCall.args[0]).to.equal('Table');
  });

  it('should call to get the next page when the next button is hit', function () {
    const getPageSpy = sinon.spy();
    renderCrudToolbar({
      getPage: getPageSpy,
    });

    expect(getPageSpy.called).to.be.false;
    fireEvent.click(screen.getByTestId('docs-toolbar-next-page-btn'));

    expect(getPageSpy.calledOnce).to.be.true;
    expect(getPageSpy.firstCall.args[0]).to.equal(1);
  });

  it('should have the prev page button disabled', function () {
    const getPageSpy = sinon.spy();
    renderCrudToolbar({
      getPage: getPageSpy,
    });

    expect(getPageSpy.called).to.be.false;
    fireEvent.click(screen.getByTestId('docs-toolbar-prev-page-btn'));

    expect(getPageSpy.calledOnce).to.be.false;
    expect(screen.getByTestId('docs-toolbar-prev-page-btn')).to.be.visible;
  });

  it('should call to get the next page when the prev button is hit on a non-first page', function () {
    const getPageSpy = sinon.spy();
    renderCrudToolbar({
      getPage: getPageSpy,
      page: 1,
      start: 20,
      end: 40,
    });

    expect(getPageSpy.called).to.be.false;
    fireEvent.click(screen.getByTestId('docs-toolbar-prev-page-btn'));

    expect(getPageSpy.calledOnce).to.be.true;
    expect(getPageSpy.firstCall.args[0]).to.equal(0);
  });

  it('should render the add data button when it is not readonly', function () {
    renderCrudToolbar({
      readonly: false,
    });

    expect(screen.queryByText(addDataText)).to.be.visible;
  });

  it('should not render the add data button when it is readonly', function () {
    renderCrudToolbar({
      readonly: true,
    });

    expect(screen.queryByText(addDataText)).to.not.exist;
  });
});
