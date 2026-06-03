import React from 'react';
import { expect } from 'chai';
import Sinon from 'sinon';
import {
  render,
  screen,
  cleanup,
  userEvent,
  waitFor,
} from '@mongodb-js/testing-library-compass';

import { LoadedFavoriteBreadcrumbChip } from './loaded-favorite-breadcrumb-chip';

describe('LoadedFavoriteBreadcrumbChip', function () {
  afterEach(cleanup);

  describe('rendering', function () {
    it('renders nothing when no favorite is loaded', function () {
      render(
        <LoadedFavoriteBreadcrumbChip
          name={null}
          isDirty={false}
          rename={null}
        />
      );
      expect(
        screen.queryByTestId('collection-header-loaded-favorite-chip')
      ).to.equal(null);
    });

    it('renders the favorite name when loaded and clean', function () {
      render(
        <LoadedFavoriteBreadcrumbChip
          name="Active customers"
          isDirty={false}
          rename={Sinon.stub()}
        />
      );
      const chip = screen.getByTestId('collection-header-loaded-favorite-chip');
      expect(chip.textContent).to.contain('Active customers');
      expect(chip.getAttribute('data-dirty')).to.equal('false');
      expect(
        screen.queryByTestId('collection-header-loaded-favorite-dirty-dot')
      ).to.equal(null);
    });

    it('shows the dirty dot when isDirty is true', function () {
      render(
        <LoadedFavoriteBreadcrumbChip
          name="Active customers"
          isDirty
          rename={Sinon.stub()}
        />
      );
      expect(screen.getByTestId('collection-header-loaded-favorite-dirty-dot'))
        .to.exist;
    });
  });

  describe('inline rename', function () {
    it('enters edit mode when the name is clicked', function () {
      render(
        <LoadedFavoriteBreadcrumbChip
          name="Active customers"
          isDirty={false}
          rename={Sinon.stub()}
        />
      );
      userEvent.click(
        screen.getByTestId('collection-header-loaded-favorite-name')
      );
      expect(
        screen.getByTestId('collection-header-loaded-favorite-rename-input')
      ).to.exist;
    });

    it('Enter commits the rename via the bridge callback', async function () {
      const rename = Sinon.stub().resolves(true);
      render(
        <LoadedFavoriteBreadcrumbChip
          name="Active customers"
          isDirty={false}
          rename={rename}
        />
      );
      userEvent.click(
        screen.getByTestId('collection-header-loaded-favorite-name')
      );
      const input = screen.getByTestId(
        'collection-header-loaded-favorite-rename-input'
      );
      userEvent.clear(input);
      userEvent.type(input, 'Renamed{enter}');
      await waitFor(() => expect(rename.callCount).to.equal(1));
      expect(rename.firstCall.args[0]).to.equal('Renamed');
    });

    it('Escape cancels without dispatching the rename', async function () {
      const rename = Sinon.stub().resolves(true);
      render(
        <LoadedFavoriteBreadcrumbChip
          name="Active customers"
          isDirty={false}
          rename={rename}
        />
      );
      userEvent.click(
        screen.getByTestId('collection-header-loaded-favorite-name')
      );
      const input = screen.getByTestId(
        'collection-header-loaded-favorite-rename-input'
      );
      userEvent.clear(input);
      userEvent.type(input, 'Should not save{esc}');
      await waitFor(
        () =>
          expect(screen.queryByTestId('collection-header-loaded-favorite-name'))
            .to.exist
      );
      expect(rename.callCount).to.equal(0);
    });

    it('empty name is treated as cancel', async function () {
      const rename = Sinon.stub().resolves(true);
      render(
        <LoadedFavoriteBreadcrumbChip
          name="Active customers"
          isDirty={false}
          rename={rename}
        />
      );
      userEvent.click(
        screen.getByTestId('collection-header-loaded-favorite-name')
      );
      const input = screen.getByTestId(
        'collection-header-loaded-favorite-rename-input'
      );
      userEvent.clear(input);
      userEvent.type(input, '{enter}');
      await waitFor(
        () =>
          expect(screen.queryByTestId('collection-header-loaded-favorite-name'))
            .to.exist
      );
      expect(rename.callCount).to.equal(0);
    });

    it('unchanged name does not trigger the rename', async function () {
      const rename = Sinon.stub().resolves(true);
      render(
        <LoadedFavoriteBreadcrumbChip
          name="Active customers"
          isDirty={false}
          rename={rename}
        />
      );
      userEvent.click(
        screen.getByTestId('collection-header-loaded-favorite-name')
      );
      userEvent.type(
        screen.getByTestId('collection-header-loaded-favorite-rename-input'),
        '{enter}'
      );
      await waitFor(
        () =>
          expect(screen.queryByTestId('collection-header-loaded-favorite-name'))
            .to.exist
      );
      expect(rename.callCount).to.equal(0);
    });

    it('exits edit mode silently when rename callback is null (no producer)', async function () {
      // Defensive — in storybook or partial test setups the rename
      // callback may be absent. The chip should fail closed: exit
      // edit mode without crashing or attempting to call null.
      render(
        <LoadedFavoriteBreadcrumbChip
          name="Active customers"
          isDirty={false}
          rename={null}
        />
      );
      userEvent.click(
        screen.getByTestId('collection-header-loaded-favorite-name')
      );
      const input = screen.getByTestId(
        'collection-header-loaded-favorite-rename-input'
      );
      userEvent.clear(input);
      userEvent.type(input, 'Renamed{enter}');
      await waitFor(
        () =>
          expect(screen.queryByTestId('collection-header-loaded-favorite-name'))
            .to.exist
      );
    });
  });
});
