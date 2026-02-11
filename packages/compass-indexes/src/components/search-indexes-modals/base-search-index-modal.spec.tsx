import {
  ATLAS_SEARCH_TEMPLATES,
  ATLAS_VECTOR_SEARCH_TEMPLATE,
} from '@mongodb-js/mongodb-constants';
import { expect } from 'chai';
import { BaseSearchIndexModal } from './base-search-index-modal';
import sinon from 'sinon';
import type { SinonSpy } from 'sinon';
import {
  render,
  screen,
  cleanup,
  waitFor,
  userEvent,
} from '@mongodb-js/testing-library-compass';

import React from 'react';
import {
  getCodemirrorEditorValue,
  setCodemirrorEditorValue,
} from '@mongodb-js/compass-editor';

function normalizedTemplateNamed(name: string) {
  const snippet =
    ATLAS_SEARCH_TEMPLATES.find((t) => t.name === name)?.snippet || '';
  // code mirror 'changes' the template placeholders, so let's do the same
  // this regexp removes `tab` markers to their default value, for example:
  // ${1:default} => default
  //
  return snippet.replace(/\${\d+:([^}]+)}/gm, '$1');
}

const VALID_ATLAS_SEARCH_INDEX_DEFINITION = {
  fields: [
    {
      type: 'vector',
      path: 'pineapple',
      numDimensions: 1000,
      similarity: 'cosine',
    },
  ],
};
const VALID_ATLAS_SEARCH_INDEX_DEFINITION_STRING = JSON.stringify(
  VALID_ATLAS_SEARCH_INDEX_DEFINITION
);

function renderBaseSearchIndexModal(
  props?: Partial<React.ComponentProps<typeof BaseSearchIndexModal>>
) {
  return render(
    <BaseSearchIndexModal
      namespace="test.test"
      mode="create"
      initialIndexName={'default'}
      initialIndexDefinition={'{}'}
      isVectorSearchSupported
      isModalOpen={true}
      isBusy={false}
      onSubmit={sinon.fake()}
      onClose={sinon.fake()}
      error={'Invalid index definition.'}
      {...props}
    />
  );
}

describe('Base Search Index Modal', function () {
  afterEach(cleanup);

  describe('when rendered', function () {
    let onSubmitSpy: SinonSpy;
    let onCloseSpy: SinonSpy;

    beforeEach(function () {
      onSubmitSpy = sinon.spy();
      onCloseSpy = sinon.spy();

      renderBaseSearchIndexModal({
        onSubmit: onSubmitSpy,
        onClose: onCloseSpy,
      });
    });

    describe('default behaviour', function () {
      it('uses the initial index name as the default index name', function () {
        const inputText: HTMLInputElement = screen.getByTestId(
          'name-of-search-index'
        );

        expect(inputText).to.not.be.null;
        expect(inputText?.value).to.equal('default');
      });

      it('uses a dynamic mapping as the default index definition', function () {
        const defaultIndexDef = getCodemirrorEditorValue(
          'definition-of-search-index'
        );

        expect(defaultIndexDef).to.not.be.null;
        expect(defaultIndexDef).to.equal('{}');
      });

      it('shows vector search radio option', function () {
        expect(screen.getByText('Vector Search')).to.be.visible;
      });
    });

    describe('form validation', function () {
      it('shows an error when the index name is empty', async function () {
        const inputText: HTMLInputElement = screen.getByTestId(
          'name-of-search-index'
        );

        userEvent.clear(inputText);
        expect(await screen.findByText('Please enter the name of the index.'))
          .to.exist;
      });

      it('shows server errors', async function () {
        expect(await screen.findByText('Invalid index definition.')).to.exist;
      });
    });

    describe('form behaviour', function () {
      it('closes the modal on cancel', function () {
        userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        expect(onCloseSpy).to.have.been.calledOnce;
      });

      it('submits the modal on create search index', function () {
        userEvent.click(
          screen.getByRole('button', { name: 'Create Search Index' })
        );
        expect(onSubmitSpy).to.have.been.calledOnceWithExactly({
          name: 'default',
          definition: {},
          type: 'search',
        });
      });

      it('submits the modal with the correct type on create search index', async function () {
        userEvent.click(
          screen.getByTestId('search-index-type-vectorSearch-button'),
          undefined,
          {
            // leafygreen adds pointer-events: none on actually clickable elements
            skipPointerEventsCheck: true,
          }
        );
        await waitFor(() => {
          const indexDef = getCodemirrorEditorValue(
            'definition-of-search-index'
          );
          expect(indexDef).to.equal(ATLAS_VECTOR_SEARCH_TEMPLATE.snippet);
        });

        // Set the value to something where the create index button is enabled.
        await setCodemirrorEditorValue(
          'definition-of-search-index',
          VALID_ATLAS_SEARCH_INDEX_DEFINITION_STRING
        );
        userEvent.click(
          screen.getByRole('button', { name: 'Create Search Index' })
        );
        expect(onSubmitSpy).to.have.been.calledOnceWithExactly({
          name: 'vector_index',
          definition: VALID_ATLAS_SEARCH_INDEX_DEFINITION,
          type: 'vectorSearch',
        });
      });

      // TODO(COMPASS-7557): super flaky even on mac
      it.skip('resets the template on type switch', async function () {
        userEvent.click(
          screen.getByTestId('search-index-type-vectorSearch-button'),
          undefined,
          {
            // leafygreen adds pointer-events: none on actually clickable elements
            skipPointerEventsCheck: true,
          }
        );

        await waitFor(() => {
          const indexDef = getCodemirrorEditorValue(
            'definition-of-search-index'
          );
          expect(indexDef).to.equal(ATLAS_VECTOR_SEARCH_TEMPLATE.snippet);
        });

        userEvent.click(
          screen.getByTestId('search-index-type-search-button'),
          undefined,
          {
            // leafygreen adds pointer-events: none on actually clickable elements
            skipPointerEventsCheck: true,
          }
        );

        await waitFor(() => {
          const indexDef = getCodemirrorEditorValue(
            'definition-of-search-index'
          );
          expect(indexDef).to.equal(
            normalizedTemplateNamed('Dynamic field mappings')
          );
        });
        const submitButton = screen.getByRole('button', {
          name: 'Create Search Index',
        });
        await waitFor(() => {
          // Wait for the button to re-enable (base vector search index has submit disabled by default).
          expect(submitButton.getAttribute('aria-disabled')).to.equal('false');
        });
        userEvent.click(submitButton);
        // Ensure the state is updated when the index type and snippet change.
        expect(onSubmitSpy).to.have.been.calledOnceWithExactly({
          name: 'default',
          definition: { mappings: { dynamic: true } },
          type: 'search',
        });
      });

      it('changes index name from "default" to "vector_index" when switching to vector search', function () {
        const inputText: HTMLInputElement = screen.getByTestId(
          'name-of-search-index'
        );

        // Initially the index name should be 'default'
        expect(inputText.value).to.equal('default');

        // Switch to vector search
        userEvent.click(
          screen.getByTestId('search-index-type-vectorSearch-button'),
          undefined,
          {
            skipPointerEventsCheck: true,
          }
        );

        // Index name should change to 'vector_index'
        expect(inputText.value).to.equal('vector_index');
      });

      it('changes index name from "vector_index" to "default" when switching back to search', async function () {
        const inputText: HTMLInputElement = screen.getByTestId(
          'name-of-search-index'
        );

        // Switch to vector search first
        userEvent.click(
          screen.getByTestId('search-index-type-vectorSearch-button'),
          undefined,
          {
            skipPointerEventsCheck: true,
          }
        );

        await waitFor(() => {
          expect(inputText.value).to.equal('vector_index');
        });

        // Wait for the editor to reflect the type switch
        await waitFor(() => {
          const indexDef = getCodemirrorEditorValue(
            'definition-of-search-index'
          );
          expect(indexDef).to.equal(ATLAS_VECTOR_SEARCH_TEMPLATE.snippet);
        });

        // Switch back to search
        userEvent.click(
          screen.getByTestId('search-index-type-search-button'),
          undefined,
          {
            skipPointerEventsCheck: true,
          }
        );

        // Index name should change back to 'default'
        await waitFor(() => {
          expect(inputText.value).to.equal('default');
        });
      });

      it('does not change index name when switching to vector search if name is not "default"', function () {
        const inputText: HTMLInputElement = screen.getByTestId(
          'name-of-search-index'
        );

        // Change the index name to something custom
        userEvent.clear(inputText);
        userEvent.type(inputText, 'my_custom_index');

        expect(inputText.value).to.equal('my_custom_index');

        // Switch to vector search
        userEvent.click(
          screen.getByTestId('search-index-type-vectorSearch-button'),
          undefined,
          {
            skipPointerEventsCheck: true,
          }
        );

        // Index name should remain unchanged
        expect(inputText.value).to.equal('my_custom_index');
      });

      it('does not change index name when switching to search if name is not "vector_index"', async function () {
        const inputText: HTMLInputElement = screen.getByTestId(
          'name-of-search-index'
        );

        // Switch to vector search first
        userEvent.click(
          screen.getByTestId('search-index-type-vectorSearch-button'),
          undefined,
          {
            skipPointerEventsCheck: true,
          }
        );

        await waitFor(() => {
          expect(inputText.value).to.equal('vector_index');
        });

        // Wait for the editor to reflect the type switch
        await waitFor(() => {
          const indexDef = getCodemirrorEditorValue(
            'definition-of-search-index'
          );
          expect(indexDef).to.equal(ATLAS_VECTOR_SEARCH_TEMPLATE.snippet);
        });

        // Change the index name to something custom
        userEvent.clear(inputText);
        userEvent.type(inputText, 'my_vector_index');

        expect(inputText.value).to.equal('my_vector_index');

        // Switch back to search
        userEvent.click(
          screen.getByTestId('search-index-type-search-button'),
          undefined,
          {
            skipPointerEventsCheck: true,
          }
        );

        // Index name should remain unchanged
        expect(inputText.value).to.equal('my_vector_index');
      });
    });

    describe('templates', function () {
      before(function () {
        // TODO(COMPASS-7557): these tests don't work anywhere but on macos
        if (process.env.PLATFORM !== 'darwin') {
          this.skip();
        }
      });

      it('replaces the contents of the index editor when a template is selected', async function () {
        userEvent.click(screen.getByRole('button', { name: 'Template' }));
        userEvent.click(
          screen.getByRole('option', { name: 'Static field mappings' })
        );

        await waitFor(() => {
          const indexDef = getCodemirrorEditorValue(
            'definition-of-search-index'
          );
          expect(indexDef).to.equal(
            normalizedTemplateNamed('Static field mappings')
          );
        });
      });

      it('does not show the KNN vector field mapping template when vector search is supported', function () {
        userEvent.click(screen.getByRole('button', { name: 'Template' }));

        expect(
          screen.queryByRole('option', { name: 'KNN Vector field mapping' })
        ).to.not.exist;
      });
    });
  });

  describe('when rendered and isVectorSearchSupported is false', function () {
    let onSubmitSpy: SinonSpy;

    beforeEach(function () {
      onSubmitSpy = sinon.spy();

      renderBaseSearchIndexModal({
        onSubmit: onSubmitSpy,
        isVectorSearchSupported: false,
      });
    });

    it('does not show the vector search option', function () {
      expect(screen.queryByText('Vector Search')).to.not.exist;
    });

    it('shows the KNN vector field mapping template', function () {
      userEvent.click(screen.getByRole('button', { name: 'Template' }));
      expect(screen.getByRole('option', { name: 'KNN Vector field mapping' }))
        .to.be.visible;
    });
  });
});
