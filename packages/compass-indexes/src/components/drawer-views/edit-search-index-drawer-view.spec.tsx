import React from 'react';
import {
  cleanup,
  render,
  screen,
  waitFor,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import sinon from 'sinon';
import { setCodemirrorEditorValue } from '@mongodb-js/compass-editor';
import { Provider } from 'react-redux';

import { EditSearchIndexDrawerView } from './edit-search-index-drawer-view';
import { mockSearchIndex } from '../../../test/helpers';
import type { SearchIndex } from 'mongodb-data-service';
import { setupStore } from '../../../test/setup-store';

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
  props: Partial<React.ComponentProps<typeof EditSearchIndexDrawerView>> = {},
  options: {
    preferences?: Record<string, unknown>;
  } = {}
) {
  const defaultProps: React.ComponentProps<typeof EditSearchIndexDrawerView> = {
    namespace: 'test.collection',
    searchIndex: defaultSearchIndex as SearchIndex,
    isBusy: false,
    error: undefined,
    onClose: noop,
    onResetUpdateState: noop,
    updateIndex: noop,
    onIndexDefinitionEdit: noop,
  };

  const store = setupStore();

  render(
    <Provider store={store}>
      <EditSearchIndexDrawerView {...defaultProps} {...props} />
    </Provider>,
    { preferences: options.preferences }
  );
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

  describe('JSON schema validation', function () {
    it('shows lint markers for schema violations', async function () {
      renderEditSearchIndexDrawerView();

      const editor = screen.getByTestId('edit-search-index-drawer-view-editor');
      expect(editor).to.exist;

      // Set content that violates the search index schema
      await setCodemirrorEditorValue(editor, '{"invalidField": "value"}');

      // Wait for lint markers to appear
      await waitFor(() => {
        const lintMarkers = document.querySelectorAll(
          '.cm-lint-marker-error, .cm-lint-marker-warning'
        );
        expect(lintMarkers.length).to.be.greaterThan(0);
      });
    });

    it('disables submit button when JSON has schema validation errors', async function () {
      renderEditSearchIndexDrawerView();

      const editor = screen.getByTestId('edit-search-index-drawer-view-editor');
      expect(editor).to.exist;

      // Set syntactically valid JSON that violates schema
      await setCodemirrorEditorValue(editor, '{"notAValidProperty": 123}');

      // Wait for validation to run and button to be disabled
      await waitFor(() => {
        const submitButton = screen.getByTestId(
          'edit-search-index-drawer-view-submit-button'
        );
        expect(submitButton).to.have.attribute('aria-disabled', 'true');
      });
    });

    it('disables submit button for malformed JSON syntax', async function () {
      renderEditSearchIndexDrawerView();

      const editor = screen.getByTestId('edit-search-index-drawer-view-editor');
      expect(editor).to.exist;

      // Set syntactically invalid JSON
      await setCodemirrorEditorValue(editor, '{"unclosed": ');

      // Wait for validation to run and button to be disabled
      await waitFor(() => {
        const submitButton = screen.getByTestId(
          'edit-search-index-drawer-view-submit-button'
        );
        expect(submitButton).to.have.attribute('aria-disabled', 'true');
      });
    });

    it('enables submit button when valid changes are made', async function () {
      renderEditSearchIndexDrawerView();

      const editor = screen.getByTestId('edit-search-index-drawer-view-editor');
      expect(editor).to.exist;

      // Set valid JSON that differs from the original
      await setCodemirrorEditorValue(
        editor,
        '{"mappings": {"dynamic": false}}'
      );

      // Wait for validation to complete and button to be enabled
      await waitFor(() => {
        const submitButton = screen.getByTestId(
          'edit-search-index-drawer-view-submit-button'
        );
        expect(submitButton).to.have.attribute('aria-disabled', 'false');
      });
    });
  });

  describe('when user does not have write permissions', function () {
    it('disables the submit button and sets the editor to read-only', function () {
      renderEditSearchIndexDrawerView({}, { preferences: { readOnly: true } });

      const submitButton = screen.getByTestId(
        'edit-search-index-drawer-view-submit-button'
      );
      expect(submitButton).to.have.attribute('aria-disabled', 'true');

      const editor = screen.getByTestId('edit-search-index-drawer-view-editor');
      const cmContent = editor.querySelector('.cm-content');
      expect(cmContent).to.have.attribute('aria-readonly', 'true');
    });
  });
});
