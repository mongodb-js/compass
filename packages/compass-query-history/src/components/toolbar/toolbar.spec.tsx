import React from 'react';
import { expect } from 'chai';
import sinon from 'sinon';
import { render, screen, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Toolbar } from './toolbar';

function renderQueryHistoryToolbar(
  props?: Partial<React.ComponentProps<typeof Toolbar>>
) {
  return render(
    <Toolbar
      actions={{
        showRecent: sinon.stub(),
        showFavorites: sinon.stub(),
        collapse: sinon.stub(),
      }}
      showing="recent"
      {...props}
    />
  );
}

describe('Toolbar [Component]', function () {
  let actions;

  beforeEach(function () {
    actions = {
      showRecent: sinon.stub(),
      showFavorites: sinon.stub(),
      collapse: sinon.stub(),
    };
  });

  afterEach(cleanup);

  describe('#rendering', function () {
    beforeEach(function () {
      renderQueryHistoryToolbar({
        actions,
      });
    });

    it('renders a tablist component', function () {
      expect(screen.getByRole('tablist')).to.be.visible;
    });

    it('renders a close button', function () {
      expect(screen.getByTestId('query-history-button-close-panel')).to.be
        .visible;
    });
  });

  describe('#behavior', function () {
    it('should close the query history side bar when the close button is clicked', function () {
      renderQueryHistoryToolbar({
        actions,
      });

      const button = screen.getByTestId('query-history-button-close-panel');

      userEvent.click(button);
      expect(actions.collapse).to.have.been.calledOnce;
    });

    describe('when viewing the Recent Queries tab', function () {
      beforeEach(function () {
        renderQueryHistoryToolbar({
          actions,
          showing: 'recent',
        });
      });

      it('it should switch to the favorites tab when the Favorites button is clicked', function () {
        const favoritesTab = within(
          screen.getByTestId('past-queries-favorites')
        ).getByRole('tab');

        userEvent.click(favoritesTab);
        expect(actions.showFavorites).to.have.been.calledOnce;
      });

      it('it should be a no-op when the Recents button is clicked', function () {
        const recentsTab = within(
          screen.getByTestId('past-queries-recent')
        ).getByRole('tab');

        userEvent.click(recentsTab);
        expect(actions.showFavorites).to.not.have.been.calledOnce;
      });
    });

    describe('when viewing the Favorites tab', function () {
      beforeEach(function () {
        renderQueryHistoryToolbar({
          actions,
          showing: 'favorites',
        });
      });

      it('it should switch to the recent tab when the Recents button is clicked', function () {
        const recentsTab = within(
          screen.getByTestId('past-queries-recent')
        ).getByRole('tab');

        userEvent.click(recentsTab);
        expect(actions.showRecent).to.have.been.calledOnce;
      });

      it('it should be a no-op when the Favorites button is clicked', function () {
        const favoritesTab = within(
          screen.getByTestId('past-queries-favorites')
        ).getByRole('tab');

        userEvent.click(favoritesTab);
        expect(actions.showRecent).to.not.have.been.calledOnce;
      });
    });
  });
});
