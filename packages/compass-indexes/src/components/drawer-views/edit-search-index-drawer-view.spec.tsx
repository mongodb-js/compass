import React from 'react';
import { cleanup, render, screen } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import sinon from 'sinon';

import { EditSearchIndexDrawerView } from './edit-search-index-drawer-view';
import { mockSearchIndex } from '../../../test/helpers';
import type { SearchIndex } from 'mongodb-data-service';

const defaultSearchIndex = mockSearchIndex({
  name: 'testIndex',
  status: 'READY',
  queryable: true,
  latestDefinition: {
    mappings: {
      dynamic: true,
    },
  },
});

const noop = () => {};

function renderEditSearchIndexDrawerView(
  props: Partial<React.ComponentProps<typeof EditSearchIndexDrawerView>> = {}
) {
  const defaultProps: React.ComponentProps<typeof EditSearchIndexDrawerView> = {
    namespace: 'test.collection',
    searchIndex: defaultSearchIndex as SearchIndex,
    isDirty: false,
    isBusy: false,
    error: undefined,
    onClose: noop,
    onResetUpdateState: noop,
    updateIndex: noop,
    onIndexDefinitionEdit: noop,
  };

  render(<EditSearchIndexDrawerView {...defaultProps} {...props} />);
}

describe('EditSearchIndexDrawerView', function () {
  afterEach(function () {
    cleanup();
    sinon.restore();
  });

  describe('when rendered for search index', function () {
    it('renders the edit search index form', function () {
      renderEditSearchIndexDrawerView();

      expect(screen.getByTestId('edit-search-index-drawer-view')).to.exist;
      expect(screen.getByTestId('edit-search-index-drawer-view-title')).to
        .exist;
      expect(screen.getByTestId('edit-search-index-drawer-view-index-name')).to
        .exist;
      expect(screen.getByTestId('edit-search-index-drawer-view-editor')).to
        .exist;
      expect(screen.getByTestId('edit-search-index-drawer-view-cancel-button'))
        .to.exist;
      expect(screen.getByTestId('edit-search-index-drawer-view-submit-button'))
        .to.exist;
    });

    it('shows the index status badge', function () {
      renderEditSearchIndexDrawerView();

      expect(screen.getByTestId('edit-search-index-drawer-view-status')).to
        .exist;
    });

    it('shows the queryable badge', function () {
      renderEditSearchIndexDrawerView();

      expect(
        screen.getByTestId('edit-search-index-drawer-view-queryable-badge')
      ).to.exist;
      expect(
        screen.getByTestId('edit-search-index-drawer-view-queryable-badge')
          .textContent
      ).to.equal('Queryable');
    });

    it('shows the Search Index badge', function () {
      renderEditSearchIndexDrawerView();

      expect(
        screen.getByTestId('edit-search-index-drawer-view-index-type-badge')
      ).to.exist;
      expect(
        screen.getByTestId('edit-search-index-drawer-view-index-type-badge')
          .textContent
      ).to.equal('Search Index');
    });
  });

  describe('when rendered for vector search index', function () {
    it('renders the edit vector search index form', function () {
      const vectorSearchIndex = mockSearchIndex({
        name: 'vectorIndex',
        type: 'vectorSearch',
        status: 'READY',
        queryable: true,
        latestDefinition: {
          fields: [],
        },
      });

      renderEditSearchIndexDrawerView({
        searchIndex: vectorSearchIndex as SearchIndex,
      });

      expect(screen.getByTestId('edit-search-index-drawer-view')).to.exist;
      expect(
        screen.getByTestId('edit-search-index-drawer-view-title').textContent
      ).to.include('Vector Search Index');
      expect(
        screen.getByTestId('edit-search-index-drawer-view-index-type-badge')
          .textContent
      ).to.equal('Vector Search Index');
    });
  });

  describe('when busy', function () {
    it('disables submit button when busy', function () {
      renderEditSearchIndexDrawerView({
        isBusy: true,
      });

      const submitButton = screen.getByTestId(
        'edit-search-index-drawer-view-submit-button'
      );
      // LeafyGreen Button sets aria-disabled="true" when isLoading is true
      expect(submitButton).to.have.attribute('aria-disabled', 'true');
    });
  });

  describe('save button state', function () {
    it('disables submit button when definition has not changed', function () {
      renderEditSearchIndexDrawerView();

      const submitButton = screen.getByTestId(
        'edit-search-index-drawer-view-submit-button'
      );
      // Button is disabled because definition hasn't changed
      expect(submitButton).to.have.attribute('aria-disabled', 'true');
    });
  });
});
