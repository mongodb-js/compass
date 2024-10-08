import React from 'react';
import {
  cleanup,
  render,
  screen,
  userEvent,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import { spy } from 'sinon';
import type { SinonSpy } from 'sinon';

import RegularIndexActions from './regular-index-actions';

describe('IndexActions Component', function () {
  let onDeleteSpy: SinonSpy;
  let onHideIndexSpy: SinonSpy;
  let onUnhideIndexSpy: SinonSpy;

  before(cleanup);
  afterEach(cleanup);
  beforeEach(function () {
    onDeleteSpy = spy();
    onHideIndexSpy = spy();
    onUnhideIndexSpy = spy();
  });

  it('renders delete button for a regular index', function () {
    render(
      <RegularIndexActions
        index={{ name: 'artist_id_index' }}
        serverVersion={'4.4.0'}
        onDeleteIndexClick={onDeleteSpy}
        onHideIndexClick={onHideIndexSpy}
        onUnhideIndexClick={onUnhideIndexSpy}
      />
    );

    const button = screen.getByTestId('index-actions-delete-action');
    expect(button).to.exist;
    expect(button.getAttribute('aria-label')).to.equal(
      'Drop Index artist_id_index'
    );
    expect(onDeleteSpy.callCount).to.equal(0);
    userEvent.click(button);
    expect(onDeleteSpy.callCount).to.equal(1);
  });

  context(
    'when server version is >= 4.4.0 and the index is a regular index',
    function () {
      it('renders hide index button when index is not hidden', function () {
        render(
          <RegularIndexActions
            index={{
              name: 'artist_id_index',
            }}
            serverVersion={'4.4.0'}
            onDeleteIndexClick={onDeleteSpy}
            onHideIndexClick={onHideIndexSpy}
            onUnhideIndexClick={onUnhideIndexSpy}
          />
        );

        const button = screen.getByTestId('index-actions-hide-action');
        expect(button).to.exist;
        expect(button.getAttribute('aria-label')).to.equal(
          'Hide Index artist_id_index'
        );
        expect(onHideIndexSpy.callCount).to.equal(0);
        userEvent.click(button);
        expect(onHideIndexSpy.callCount).to.equal(1);
      });

      it('renders unhide index button when index is hidden', function () {
        render(
          <RegularIndexActions
            index={{
              name: 'artist_id_index',
              extra: { hidden: true },
            }}
            serverVersion={'4.4.0'}
            onDeleteIndexClick={onDeleteSpy}
            onHideIndexClick={onHideIndexSpy}
            onUnhideIndexClick={onUnhideIndexSpy}
          />
        );
        const button = screen.getByTestId('index-actions-unhide-action');
        expect(button).to.exist;
        expect(button.getAttribute('aria-label')).to.equal(
          'Unhide Index artist_id_index'
        );
        expect(onUnhideIndexSpy.callCount).to.equal(0);
        userEvent.click(button);
        expect(onUnhideIndexSpy.callCount).to.equal(1);
      });
    }
  );

  context(
    'when server version is < 4.4.0 and the index is a regular index',
    function () {
      it('will not render hide index button', function () {
        render(
          <RegularIndexActions
            index={{
              name: 'artist_id_index',
              extra: { hidden: true },
            }}
            serverVersion={'4.0.28'}
            onDeleteIndexClick={onDeleteSpy}
            onHideIndexClick={onHideIndexSpy}
            onUnhideIndexClick={onUnhideIndexSpy}
          />
        );
        expect(() => screen.getByTestId('index-actions-hide-action')).to.throw;
      });
    }
  );
});
