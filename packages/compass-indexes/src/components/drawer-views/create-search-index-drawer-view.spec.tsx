import React from 'react';
import {
  cleanup,
  render,
  screen,
  userEvent,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import sinon from 'sinon';

import {
  CreateSearchIndexDrawerView,
  getNextAvailableIndexName,
} from './create-search-index-drawer-view';
import type { SearchIndexType } from '../../modules/indexes-drawer';

const noop = () => {};

function renderCreateSearchIndexDrawerView(
  props: Partial<React.ComponentProps<typeof CreateSearchIndexDrawerView>> = {}
) {
  const defaultProps: React.ComponentProps<typeof CreateSearchIndexDrawerView> =
    {
      namespace: 'test.collection',
      searchIndexes: [],
      currentIndexType: 'search' as SearchIndexType,
      isDirty: false,
      isBusy: false,
      error: undefined,
      onClose: noop,
      onResetCreateState: noop,
      createIndex: noop,
      onIndexDefinitionEdit: noop,
    };

  render(<CreateSearchIndexDrawerView {...defaultProps} {...props} />);
}

describe('CreateSearchIndexDrawerView', function () {
  afterEach(function () {
    cleanup();
    sinon.restore();
  });

  describe('when rendered for search index', function () {
    it('renders the create search index form', function () {
      renderCreateSearchIndexDrawerView();

      expect(screen.getByTestId('create-search-index-drawer-view')).to.exist;
      expect(screen.getByTestId('create-search-index-drawer-view-title')).to
        .exist;
      expect(screen.getByTestId('create-search-index-drawer-view-name-input'))
        .to.exist;
      expect(screen.getByTestId('create-search-index-drawer-view-editor')).to
        .exist;
      expect(
        screen.getByTestId('create-search-index-drawer-view-cancel-button')
      ).to.exist;
      expect(
        screen.getByTestId('create-search-index-drawer-view-submit-button')
      ).to.exist;
    });

    it('has default index name set to "default"', function () {
      renderCreateSearchIndexDrawerView();

      const nameInput = screen.getByTestId(
        'create-search-index-drawer-view-name-input'
      ) as HTMLInputElement;
      expect(nameInput.value).to.equal('default');
    });

    it('shows the definition editor', function () {
      renderCreateSearchIndexDrawerView();

      const editor = screen.getByTestId(
        'create-search-index-drawer-view-editor'
      );
      expect(editor).to.exist;
      // The editor contains the template content (with line numbers prepended)
      expect(editor.textContent).to.include('mappings');
    });
  });

  describe('when rendered for vector search index', function () {
    it('renders the create vector search index form', function () {
      renderCreateSearchIndexDrawerView({
        currentIndexType: 'vectorSearch',
      });

      expect(screen.getByTestId('create-search-index-drawer-view')).to.exist;
      expect(
        screen.getByTestId('create-search-index-drawer-view-title').textContent
      ).to.include('Vector Search Index');
      expect(
        screen.getByTestId('create-search-index-drawer-view-submit-button')
      ).to.exist;
    });

    it('has default index name set to "vector_index"', function () {
      renderCreateSearchIndexDrawerView({
        currentIndexType: 'vectorSearch',
      });

      const nameInput = screen.getByTestId(
        'create-search-index-drawer-view-name-input'
      ) as HTMLInputElement;
      expect(nameInput.value).to.equal('vector_index');
    });
  });

  describe('form validation', function () {
    it('shows error when index name is empty', function () {
      renderCreateSearchIndexDrawerView();

      const nameInput = screen.getByTestId(
        'create-search-index-drawer-view-name-input'
      );
      userEvent.clear(nameInput);

      expect(screen.getByText('Please enter the name of the index.')).to.exist;
    });
  });

  describe('when busy', function () {
    it('disables submit button when busy', function () {
      renderCreateSearchIndexDrawerView({
        isBusy: true,
      });

      const submitButton = screen.getByTestId(
        'create-search-index-drawer-view-submit-button'
      );
      // LeafyGreen Button sets aria-disabled="true" when isLoading is true
      expect(submitButton).to.have.attribute('aria-disabled', 'true');
    });

    it('enables submit button when not busy', function () {
      renderCreateSearchIndexDrawerView({
        isBusy: false,
      });

      const submitButton = screen.getByTestId(
        'create-search-index-drawer-view-submit-button'
      );
      expect(submitButton).to.have.attribute('aria-disabled', 'false');
    });
  });
});

describe('getNextAvailableIndexName', function () {
  it('returns the default name when no indexes exist', function () {
    expect(getNextAvailableIndexName([], 'default')).to.equal('default');
  });

  it('returns the default name when it is not taken', function () {
    const indexes = [{ name: 'other_index' }] as any;
    expect(getNextAvailableIndexName(indexes, 'default')).to.equal('default');
  });

  it('returns default_1 when default is taken', function () {
    const indexes = [{ name: 'default' }] as any;
    expect(getNextAvailableIndexName(indexes, 'default')).to.equal('default_1');
  });

  it('returns default_2 when default and default_1 are taken', function () {
    const indexes = [{ name: 'default' }, { name: 'default_1' }] as any;
    expect(getNextAvailableIndexName(indexes, 'default')).to.equal('default_2');
  });

  it('returns the next available number in sequence', function () {
    const indexes = [
      { name: 'default' },
      { name: 'default_1' },
      { name: 'default_2' },
      { name: 'default_3' },
    ] as any;
    expect(getNextAvailableIndexName(indexes, 'default')).to.equal('default_4');
  });

  it('fills gaps in the sequence', function () {
    const indexes = [
      { name: 'default' },
      { name: 'default_2' },
      { name: 'default_3' },
    ] as any;
    expect(getNextAvailableIndexName(indexes, 'default')).to.equal('default_1');
  });

  it('works with vector_index as default name', function () {
    const indexes = [{ name: 'vector_index' }] as any;
    expect(getNextAvailableIndexName(indexes, 'vector_index')).to.equal(
      'vector_index_1'
    );
  });

  it('works with custom default names', function () {
    const indexes = [{ name: 'my_index' }, { name: 'my_index_1' }] as any;
    expect(getNextAvailableIndexName(indexes, 'my_index')).to.equal(
      'my_index_2'
    );
  });
});
