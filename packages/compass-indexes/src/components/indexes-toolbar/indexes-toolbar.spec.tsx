import React from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'chai';
import AppRegistry from 'hadron-app-registry';
import sinon from 'sinon';

import { IndexesToolbar } from './indexes-toolbar';

const renderIndexesToolbar = (
  props: Partial<React.ComponentProps<typeof IndexesToolbar>> = {}
) => {
  const appRegistry = new AppRegistry();

  render(
    <IndexesToolbar
      errorMessage={null}
      isReadonly={false}
      isReadonlyView={false}
      isWritable={true}
      localAppRegistry={appRegistry}
      writeStateDescription={undefined}
      onRefreshIndexes={() => {}}
      isRefreshing={false}
      {...props}
    />
  );
};

describe('IndexesToolbar Component', function () {
  before(cleanup);
  afterEach(cleanup);

  describe('when rendered', function () {
    beforeEach(function () {
      renderIndexesToolbar();
    });

    it('should render the create index button enabled', function () {
      expect(
        screen.getByText('Create Index').closest('button')
      ).to.not.have.attr('disabled');
    });

    it('should not render a warning', function () {
      expect(screen.queryByText('Readonly views may not contain indexes')).to
        .not.exist;
    });
  });

  describe('when it is a readonly view', function () {
    beforeEach(function () {
      renderIndexesToolbar({
        isReadonlyView: true,
      });
    });

    it('should not render the create index button', function () {
      expect(screen.queryByText('Create Index')).to.not.exist;
    });

    it('should render a warning', function () {
      expect(screen.getByText('Readonly views may not contain indexes.')).to.be
        .visible;
    });
  });

  describe('when it is readonly', function () {
    beforeEach(function () {
      renderIndexesToolbar({
        isReadonly: true,
      });
    });

    it('should not render the create index button', function () {
      expect(screen.queryByText('Create Index')).to.not.exist;
    });
  });

  describe('when there is an error', function () {
    beforeEach(function () {
      renderIndexesToolbar({
        errorMessage: 'Pineapple',
      });
    });

    it('should not render the create index button', function () {
      expect(screen.queryByText('Create Index')).to.not.exist;
    });

    it('should render the error', function () {
      expect(screen.getByText('Pineapple')).to.be.visible;
    });
  });

  describe('when the write state is not writable', function () {
    beforeEach(function () {
      renderIndexesToolbar({
        isWritable: false,
      });
    });

    it('should render the create index button disabled', function () {
      expect(screen.getByText('Create Index').closest('button')).to.have.attr(
        'disabled'
      );
    });
  });

  describe('when the create index button is clicked', function () {
    let emitSpy: sinon.SinonSpy;
    beforeEach(function () {
      const appRegistry = new AppRegistry();
      emitSpy = sinon.spy();
      sinon.replace(appRegistry, 'emit', emitSpy);
      renderIndexesToolbar({
        localAppRegistry: appRegistry,
      });
      expect(emitSpy).to.not.have.been.called;

      const createIndexButton = screen.getByTestId(
        'open-create-index-modal-button'
      );
      userEvent.click(createIndexButton);
    });

    it('should emit "toggle-create-index-modal" on the local app registry', function () {
      expect(emitSpy).to.have.been.calledOnce;
      expect(emitSpy.firstCall.args[0]).to.equal('toggle-create-index-modal');
      expect(emitSpy.firstCall.args[1]).to.equal(true);
    });
  });

  describe('when the refresh button is clicked', function () {
    it('renders refresh button - enabled state', function () {
      renderIndexesToolbar({
        isRefreshing: false,
      });
      const refreshButton = screen.getByTestId('refresh-indexes-button');
      expect(refreshButton).to.exist;
      expect(refreshButton.getAttribute('disabled')).to.be.null;
    });

    it('renders refresh button - disabled state', function () {
      renderIndexesToolbar({
        isRefreshing: true,
      });
      const refreshButton = screen.getByTestId('refresh-indexes-button');
      expect(refreshButton).to.exist;
      expect(refreshButton.getAttribute('disabled')).to.not.be.null;
      expect(within(refreshButton).getByTitle(/refreshing indexes/i)).to.exist;
    });

    it('should call onRefreshIndexes', function () {
      const onRefreshIndexesSpy = sinon.spy();
      renderIndexesToolbar({
        onRefreshIndexes: onRefreshIndexesSpy,
      });
      const refreshButton = screen.getByTestId('refresh-indexes-button');
      expect(onRefreshIndexesSpy.callCount).to.equal(0);
      userEvent.click(refreshButton);
      expect(onRefreshIndexesSpy).to.have.been.calledOnce;
    });
  });
});
