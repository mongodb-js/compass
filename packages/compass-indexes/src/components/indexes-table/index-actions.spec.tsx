import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { expect } from 'chai';
import { spy } from 'sinon';
import type { SinonSpy } from 'sinon';
import userEvent from '@testing-library/user-event';

import IndexActions from './index-actions';

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
    render(
      <IndexActions
        index={{ name: 'artist_id_index' } as any}
        serverVersion={'4.4.0'}
        onDeleteIndex={onDeleteSpy}
        onHideIndex={onHideIndexSpy}
        onUnhideIndex={onUnhideIndexSpy}
      />
    );
  });

  it('renders delete button', function () {
    const button = screen.getByTestId('index-actions-delete-action');
    expect(button).to.exist;
    expect(button.getAttribute('aria-label')).to.equal(
      'Drop Index artist_id_index'
    );
    expect(onDeleteSpy.callCount).to.equal(0);
    userEvent.click(button);
    expect(onDeleteSpy.callCount).to.equal(1);
  });

  context('when server version is >= 4.4.0', function () {
    it('renders hide index button when index is not hidden', function () {
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
        <IndexActions
          index={{ name: 'artist_id_index', extra: { hidden: true } } as any}
          serverVersion={'4.4.0'}
          onDeleteIndex={onDeleteSpy}
          onHideIndex={onHideIndexSpy}
          onUnhideIndex={onUnhideIndexSpy}
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
  });

  context('when server version is < 4.4.0', function () {
    it('will not render hide index button', function () {
      render(
        <IndexActions
          index={{ name: 'artist_id_index', extra: { hidden: true } } as any}
          serverVersion={'4.0.28'}
          onDeleteIndex={onDeleteSpy}
          onHideIndex={onHideIndexSpy}
          onUnhideIndex={onUnhideIndexSpy}
        />
      );
      expect(() => screen.getByTestId('index-actions-hide-action')).to.throw;
    });
  });
});
