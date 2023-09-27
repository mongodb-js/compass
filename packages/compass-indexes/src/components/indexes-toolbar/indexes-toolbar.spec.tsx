import React from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'chai';
import sinon from 'sinon';
import preferencesAccess from 'compass-preferences-model';

import { IndexesToolbar } from './indexes-toolbar';

const renderIndexesToolbar = (
  props: Partial<React.ComponentProps<typeof IndexesToolbar>> = {}
) => {
  render(
    <IndexesToolbar
      indexView="regular-indexes"
      hasTooManyIndexes={false}
      errorMessage={null}
      isReadonlyView={false}
      readOnly={false}
      isWritable={true}
      writeStateDescription={undefined}
      onRefreshIndexes={() => {}}
      isAtlasSearchSupported={false}
      isRefreshing={false}
      onChangeIndexView={() => {}}
      onCreateRegularIndex={() => {}}
      onCreateSearchIndex={() => {}}
      {...props}
    />
  );
};

describe('IndexesToolbar Component', function () {
  before(cleanup);
  afterEach(cleanup);

  describe('when rendered', function () {
    describe('with atlas search index management is disabled', function () {
      let sandbox: sinon.SinonSandbox;

      afterEach(function () {
        return sandbox.restore();
      });

      beforeEach(function () {
        sandbox = sinon.createSandbox();
        sandbox.stub(preferencesAccess, 'getPreferences').returns({
          enableAtlasSearchIndexManagement: false,
          showInsights: true,
        } as any);

        renderIndexesToolbar({});
      });

      it('should render the create index button enabled', function () {
        expect(
          screen.getByText('Create Index').closest('button')
        ).to.not.have.attr('disabled');
      });
    });

    describe('with atlas search index management is enabled', function () {
      describe('when cluster has Atlas Search available', function () {
        let sandbox: sinon.SinonSandbox;

        afterEach(function () {
          return sandbox.restore();
        });

        beforeEach(function () {
          sandbox = sinon.createSandbox();
          sandbox.stub(preferencesAccess, 'getPreferences').returns({
            enableAtlasSearchIndexManagement: true,
            showInsights: true,
          } as any);

          renderIndexesToolbar({ isAtlasSearchSupported: true });
        });

        it('should render the create index dropdown button enabled', async function () {
          const createSplitDropdown = screen.getByTestId(
            'multiple-index-types-creation-dropdown-show-actions'
          );
          expect(createSplitDropdown).to.exist;
          expect(createSplitDropdown).to.not.have.attr('disabled');

          userEvent.click(createSplitDropdown);

          expect((await screen.findByText('Index')).closest('button')).to.be
            .visible;
          expect((await screen.findByText('Search Index')).closest('button')).to
            .be.visible;
        });
      });

      describe('when cluster does not support Atlas Search', function () {
        let sandbox: sinon.SinonSandbox;

        afterEach(function () {
          return sandbox.restore();
        });

        beforeEach(function () {
          sandbox = sinon.createSandbox();
          sandbox.stub(preferencesAccess, 'getPreferences').returns({
            enableAtlasSearchIndexManagement: true,
            showInsights: true,
          } as any);

          renderIndexesToolbar({ isAtlasSearchSupported: false });
        });

        it('should render the create index button only', function () {
          expect(
            screen.getByText('Create Index').closest('button')
          ).to.not.have.attr('disabled');
        });
      });
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

  describe('when it is preferences ReadOnly', function () {
    beforeEach(function () {
      renderIndexesToolbar({
        readOnly: true,
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

  describe('allows creating of indexes', function () {
    let sandbox: sinon.SinonSandbox;
    beforeEach(function () {
      sandbox = sinon.createSandbox();
      sandbox.stub(preferencesAccess, 'getPreferences').returns({
        enableAtlasSearchIndexManagement: true,
      } as any);
    });
    afterEach(function () {
      sandbox.restore();
    });
    context('when search indexes is not supported', function () {
      it('calls onCreateRegularIndex when index button is clicked', function () {
        const onCreateRegularIndexSpy = sinon.spy();
        renderIndexesToolbar({
          onCreateRegularIndex: onCreateRegularIndexSpy,
        });
        expect(onCreateRegularIndexSpy).to.not.have.been.called;

        screen.getByTestId('open-create-index-modal-button').click();

        expect(onCreateRegularIndexSpy).to.have.been.calledOnce;
      });
    });

    context('when search indexes is supported', function () {
      it('calls onCreateRegularIndex when index button is clicked', function () {
        const onCreateRegularIndexSpy = sinon.spy();
        renderIndexesToolbar({
          isAtlasSearchSupported: true,
          onCreateRegularIndex: onCreateRegularIndexSpy,
        });

        // open the dropdown
        screen
          .getByTestId('multiple-index-types-creation-dropdown-show-actions')
          .click();

        expect(onCreateRegularIndexSpy).to.not.have.been.called;

        // click the button
        screen
          .getByTestId(
            'multiple-index-types-creation-dropdown-createRegularIndex-action'
          )
          .click();

        expect(onCreateRegularIndexSpy).to.have.been.calledOnce;
      });
      it('calls onCreateSearchIndex when index button is clicked', function () {
        const onCreateSearchIndexSpy = sinon.spy();
        renderIndexesToolbar({
          isAtlasSearchSupported: true,
          onCreateSearchIndex: onCreateSearchIndexSpy,
        });

        // open the dropdown
        screen
          .getByTestId('multiple-index-types-creation-dropdown-show-actions')
          .click();

        expect(onCreateSearchIndexSpy).to.not.have.been.called;

        // click the button
        screen
          .getByTestId(
            'multiple-index-types-creation-dropdown-createSearchIndex-action'
          )
          .click();

        expect(onCreateSearchIndexSpy).to.have.been.calledOnce;
      });
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

  describe('when there are too many indexes', function () {
    it('should render insights for too many indexes', function () {
      renderIndexesToolbar({
        hasTooManyIndexes: true,
      });
      expect(() => screen.getByTestId('insight-badge-button')).to.not.throw;
    });

    context('and when there is an error', function () {
      it('should not render insights', function () {
        renderIndexesToolbar({
          hasTooManyIndexes: true,
          errorMessage: 'Something bad happened',
        });
        expect(() => screen.getByTestId('insight-badge-button')).to.throw;
      });
    });
  });

  describe('segment control', function () {
    let sandbox: sinon.SinonSandbox;
    let onChangeViewCallback: sinon.SinonSpy;

    afterEach(function () {
      return sandbox.restore();
    });

    beforeEach(function () {
      sandbox = sinon.createSandbox();
      sandbox.stub(preferencesAccess, 'getPreferences').returns({
        enableAtlasSearchIndexManagement: true,
        showInsights: true,
      } as any);

      onChangeViewCallback = sinon.spy();
    });

    it('when it supports search management, it changes tab view', function () {
      renderIndexesToolbar({
        isAtlasSearchSupported: true,
        onChangeIndexView: onChangeViewCallback,
      });
      const segmentControl = screen.getByText('Search Indexes');
      userEvent.click(segmentControl);

      expect(onChangeViewCallback).to.have.been.calledOnce;
      expect(onChangeViewCallback.firstCall.args[0]).to.equal('search-indexes');
    });

    it('when it does not support search management, it renders tab as disabled', function () {
      renderIndexesToolbar({
        isAtlasSearchSupported: false,
        onChangeIndexView: onChangeViewCallback,
      });
      const segmentControl = screen.getByText('Search Indexes');
      userEvent.click(segmentControl);

      expect(segmentControl.closest('button')).to.have.attr('disabled');
      expect(onChangeViewCallback).to.not.have.been.calledOnce;
    });
  });
});
