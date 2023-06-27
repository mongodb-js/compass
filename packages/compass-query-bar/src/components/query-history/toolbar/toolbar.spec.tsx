import React from 'react';
import { expect } from 'chai';
import Sinon from 'sinon';
import { render, screen, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Toolbar } from './toolbar';

function renderToolbar(props?: Partial<React.ComponentProps<typeof Toolbar>>) {
  return render(
    <Toolbar
      tab="recent"
      namespace={'test.test'}
      onChange={() => {}}
      {...props}
    />
  );
}

describe('Toolbar [Component]', function () {
  let onChangeSpy: Sinon.SinonSpy;
  beforeEach(function () {
    onChangeSpy = Sinon.spy();
  });

  afterEach(cleanup);

  describe('#rendering', function () {
    beforeEach(function () {
      renderToolbar();
    });
    it('renders a tablist component', function () {
      expect(screen.getByRole('tablist')).to.be.visible;
    });

    it('renders the namespace', function () {
      expect(screen.getByText('Queries in')).to.be.visible;
      expect(screen.getByText('test.test')).to.be.visible;
    });
  });

  describe('#behavior', function () {
    describe('when viewing the Recent Queries tab', function () {
      beforeEach(function () {
        renderToolbar({
          tab: 'recent',
          onChange: onChangeSpy,
        });
      });

      it('it should switch to the favorites tab when the Favorites button is clicked', function () {
        const favoritesTab = within(
          screen.getByTestId('past-queries-favorites')
        ).getByRole('tab');

        userEvent.click(favoritesTab);
        expect(onChangeSpy.calledOnce).to.be.true;
        expect(onChangeSpy.firstCall.firstArg).to.equal('favorite');
      });

      it('it should be a no-op when the Recents button is clicked', function () {
        const recentsTab = within(
          screen.getByTestId('past-queries-recent')
        ).getByRole('tab');

        userEvent.click(recentsTab);
        expect(onChangeSpy.callCount).to.equal(0);
      });
    });

    describe('when viewing the Favorites tab', function () {
      beforeEach(function () {
        renderToolbar({
          tab: 'favorite',
          onChange: onChangeSpy,
        });
      });

      it('it should switch to the recent tab when the Recents button is clicked', function () {
        const recentsTab = within(
          screen.getByTestId('past-queries-recent')
        ).getByRole('tab');

        userEvent.click(recentsTab);
        expect(onChangeSpy.calledOnce).to.be.true;
        expect(onChangeSpy.firstCall.firstArg).to.equal('recent');
      });

      it('it should be a no-op when the Favorites button is clicked', function () {
        const favoritesTab = within(
          screen.getByTestId('past-queries-favorites')
        ).getByRole('tab');

        userEvent.click(favoritesTab);
        expect(onChangeSpy.callCount).to.equal(0);
      });
    });
  });
});
