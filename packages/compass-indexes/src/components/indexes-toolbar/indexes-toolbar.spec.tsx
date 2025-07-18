import React from 'react';
import {
  cleanup,
  render,
  screen,
  within,
  userEvent,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import sinon from 'sinon';

import { IndexesToolbar } from './indexes-toolbar';
import type { PreferencesAccess } from 'compass-preferences-model';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';
import { PreferencesProvider } from 'compass-preferences-model/provider';

describe('IndexesToolbar Component', function () {
  before(cleanup);
  afterEach(cleanup);

  let preferences: PreferencesAccess;
  beforeEach(async function () {
    preferences = await createSandboxFromDefaultPreferences();
  });

  const renderIndexesToolbar = (
    props: Partial<React.ComponentProps<typeof IndexesToolbar>> = {}
  ) => {
    render(
      <PreferencesProvider value={preferences}>
        <IndexesToolbar
          indexView="regular-indexes"
          hasTooManyIndexes={false}
          errorMessage={null}
          isReadonlyView={false}
          readOnly={false}
          isWritable={true}
          writeStateDescription={undefined}
          onRefreshIndexes={() => {}}
          isSearchIndexesSupported={false}
          isRefreshing={false}
          onIndexViewChanged={() => {}}
          onCreateRegularIndexClick={() => {}}
          onCreateSearchIndexClick={() => {}}
          namespace=""
          showAtlasSearchLink={false}
          serverVersion={'8.0.11'}
          {...props}
        />
      </PreferencesProvider>
    );
  };

  describe('when rendered', function () {
    describe('with atlas search index management is disabled', function () {
      beforeEach(async function () {
        await preferences.savePreferences({
          showInsights: true,
        });

        renderIndexesToolbar({});
      });

      it('should render the create index button enabled', function () {
        expect(
          screen
            .getByText('Create Index')
            .closest('button')
            ?.getAttribute('aria-disabled')
        ).to.equal('false');
      });
    });

    describe('with atlas search index management is enabled', function () {
      describe('when cluster has Atlas Search available', function () {
        beforeEach(async function () {
          await preferences.savePreferences({
            showInsights: true,
          });

          renderIndexesToolbar({ isSearchIndexesSupported: true });
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
        beforeEach(async function () {
          await preferences.savePreferences({
            showInsights: true,
          });

          renderIndexesToolbar({ isSearchIndexesSupported: false });
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
      expect(
        screen
          .getByText('Create Index')
          .closest('button')
          ?.getAttribute('aria-disabled')
      ).to.equal('true');
    });
  });

  describe('allows creating of indexes', function () {
    context('when search indexes is not supported', function () {
      it('calls onCreateRegularIndexClick when index button is clicked', function () {
        const onCreateRegularIndexClickSpy = sinon.spy();
        renderIndexesToolbar({
          onCreateRegularIndexClick: onCreateRegularIndexClickSpy,
        });
        expect(onCreateRegularIndexClickSpy).to.not.have.been.called;

        screen.getByTestId('open-create-index-modal-button').click();

        expect(onCreateRegularIndexClickSpy).to.have.been.calledOnce;
      });
    });

    context('when search indexes is supported', function () {
      it('calls onCreateRegularIndexClick when index button is clicked', function () {
        const onCreateRegularIndexClickSpy = sinon.spy();
        renderIndexesToolbar({
          isSearchIndexesSupported: true,
          onCreateRegularIndexClick: onCreateRegularIndexClickSpy,
        });

        // open the dropdown
        screen
          .getByTestId('multiple-index-types-creation-dropdown-show-actions')
          .click();

        expect(onCreateRegularIndexClickSpy).to.not.have.been.called;

        // click the button
        screen
          .getByTestId(
            'multiple-index-types-creation-dropdown-createRegularIndex-action'
          )
          .click();

        expect(onCreateRegularIndexClickSpy).to.have.been.calledOnce;
      });
      it('calls onCreateSearchIndexClick when index button is clicked', function () {
        const onCreateSearchIndexClickSpy = sinon.spy();
        renderIndexesToolbar({
          isSearchIndexesSupported: true,
          onCreateSearchIndexClick: onCreateSearchIndexClickSpy,
        });

        // open the dropdown
        screen
          .getByTestId('multiple-index-types-creation-dropdown-show-actions')
          .click();

        expect(onCreateSearchIndexClickSpy).to.not.have.been.called;

        // click the button
        screen
          .getByTestId(
            'multiple-index-types-creation-dropdown-createSearchIndex-action'
          )
          .click();

        expect(onCreateSearchIndexClickSpy).to.have.been.calledOnce;
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
      expect(refreshButton.getAttribute('aria-disabled')).to.equal('false');
    });

    it('renders refresh button - disabled state', function () {
      renderIndexesToolbar({
        isRefreshing: true,
      });
      const refreshButton = screen.getByTestId('refresh-indexes-button');
      expect(refreshButton).to.exist;
      expect(refreshButton.getAttribute('aria-disabled')).to.not.be.null;
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
    let onChangeViewCallback: sinon.SinonSpy;

    beforeEach(async function () {
      await preferences.savePreferences({
        showInsights: true,
      });

      onChangeViewCallback = sinon.spy();
    });

    it('when it supports search management, it changes tab view', function () {
      renderIndexesToolbar({
        isSearchIndexesSupported: true,
        onIndexViewChanged: onChangeViewCallback,
      });
      const segmentControl = screen.getByText('Search Indexes');
      userEvent.click(segmentControl);

      expect(onChangeViewCallback).to.have.been.calledOnce;
      expect(onChangeViewCallback.firstCall.args[0]).to.equal('search-indexes');
    });

    it('when it does not support search management, it renders tab as disabled', function () {
      renderIndexesToolbar({
        isSearchIndexesSupported: false,
        onIndexViewChanged: onChangeViewCallback,
      });
      const segmentControl = screen.getByText('Search Indexes');
      userEvent.click(segmentControl);

      expect(segmentControl.closest('button')).to.have.attr('disabled');
      expect(onChangeViewCallback).to.not.have.been.calledOnce;
    });
  });
});
