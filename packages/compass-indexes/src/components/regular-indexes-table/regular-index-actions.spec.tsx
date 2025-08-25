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
import type { RegularIndex } from '../../modules/regular-indexes';

const commonIndexProperties: RegularIndex = {
  name: 'artist_id_index',
  type: 'regular',
  cardinality: 'compound',
  properties: [],
  fields: [],
  extra: {},
  size: 0,
  relativeSize: 0,
  usageCount: 0,
  buildProgress: 0,
};

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

  describe('build progress display', function () {
    it('does not display progress percentage when buildProgress is 0', function () {
      render(
        <RegularIndexActions
          index={{
            ...commonIndexProperties,
            name: 'test_index',
            buildProgress: 0,
          }}
          serverVersion={'4.4.0'}
          onDeleteIndexClick={onDeleteSpy}
          onHideIndexClick={onHideIndexSpy}
          onUnhideIndexClick={onUnhideIndexSpy}
        />
      );

      // Should not show building spinner or percentage
      expect(() => screen.getByTestId('index-building-spinner')).to.throw;
      expect(() => screen.getByText(/Building\.\.\. \d+%/)).to.throw;
    });

    it('displays progress percentage when buildProgress is 50% (0.5)', function () {
      render(
        <RegularIndexActions
          index={{
            ...commonIndexProperties,
            name: 'test_index',
            buildProgress: 0.5,
          }}
          serverVersion={'4.4.0'}
          onDeleteIndexClick={onDeleteSpy}
          onHideIndexClick={onHideIndexSpy}
          onUnhideIndexClick={onUnhideIndexSpy}
        />
      );

      // Should show building spinner and percentage
      const buildingSpinner = screen.getByTestId('index-building-spinner');
      expect(buildingSpinner).to.exist;

      const progressText = screen.getByText('Building... 50%');
      expect(progressText).to.exist;
    });

    it('does not display progress percentage when buildProgress is 100% (1.0)', function () {
      render(
        <RegularIndexActions
          index={{
            ...commonIndexProperties,
            name: 'test_index',
            buildProgress: 1.0,
          }}
          serverVersion={'4.4.0'}
          onDeleteIndexClick={onDeleteSpy}
          onHideIndexClick={onHideIndexSpy}
          onUnhideIndexClick={onUnhideIndexSpy}
        />
      );

      // Should not show building spinner or percentage when complete
      expect(() => screen.getByTestId('index-building-spinner')).to.throw;
      expect(() => screen.getByText(/Building\.\.\. \d+%/)).to.throw;
    });

    it('displays cancel button when index is building', function () {
      render(
        <RegularIndexActions
          index={{
            ...commonIndexProperties,
            name: 'building_index',
            buildProgress: 0.3,
          }}
          serverVersion={'4.4.0'}
          onDeleteIndexClick={onDeleteSpy}
          onHideIndexClick={onHideIndexSpy}
          onUnhideIndexClick={onUnhideIndexSpy}
        />
      );

      const cancelButton = screen.getByLabelText('Cancel Index building_index');
      expect(cancelButton).to.exist;
      expect(onDeleteSpy.callCount).to.equal(0);
      userEvent.click(cancelButton);
      expect(onDeleteSpy.callCount).to.equal(1);
    });
  });

  it('renders delete button for a regular index', function () {
    render(
      <RegularIndexActions
        index={{
          ...commonIndexProperties,
          name: 'artist_id_index',
        }}
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
              ...commonIndexProperties,
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
              ...commonIndexProperties,
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
              ...commonIndexProperties,
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
