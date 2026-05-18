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
import { Provider } from 'react-redux';
import { createNoopLogger } from '@mongodb-js/compass-logging/provider';
import { createNoopTrack } from '@mongodb-js/compass-telemetry/provider';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';

import { SaveDraftAsFavoriteModal } from './save-draft-as-favorite-modal';
import { QueryBarStoreContext } from '../stores/context';
import {
  configureStore,
  type QueryBarExtraArgs,
} from '../stores/query-bar-store';
import { setQuery } from '../stores/query-bar-reducer';

// Use the real `configureStore` so the thunk middleware + reducer are
// wired identically to production. The modal mounts under a Provider
// pointing at our custom QueryBarStoreContext (the same one
// connect/useStore use in this package).
async function renderModal(opts: {
  saveQueryStub?: Sinon.SinonStub;
  loadedFavoriteId?: string | null;
  favoriteQueries?: Array<{
    _id: string;
    _name: string;
    _mcpPromptName?: string;
  }>;
  onCancel?: () => void;
  mode?: 'save' | 'save-as';
}) {
  const saveQueryStub = opts.saveQueryStub ?? Sinon.stub().resolves();
  const preferences = await createSandboxFromDefaultPreferences();
  const store = configureStore(
    {
      favoriteQueries: (opts.favoriteQueries ?? []) as never,
      loadedFavoriteId: opts.loadedFavoriteId ?? null,
      namespace: 'db.coll',
    },
    {
      preferences,
      logger: createNoopLogger(),
      track: createNoopTrack(),
      favoriteQueryStorage: {
        saveQuery: saveQueryStub,
        loadAll: Sinon.stub().resolves([]),
        updateAttributes: Sinon.stub().resolves(),
      },
    } as unknown as QueryBarExtraArgs
  );
  // Populate a non-default filter so saveDraftAsFavorite doesn't refuse
  // to save (its `isEmpty(queryAttributes)` guard rejects pure-default
  // queries). Mirrors what the production code does — the menu only
  // opens the modal when the draft has changes — but the modal itself
  // shouldn't crash on that path either.
  store.dispatch(setQuery({ filter: { x: 1 } }));
  const onCancel = opts.onCancel ?? Sinon.spy();
  render(
    <Provider context={QueryBarStoreContext as never} store={store}>
      <SaveDraftAsFavoriteModal
        open
        mode={opts.mode ?? 'save'}
        onCancel={onCancel}
      />
    </Provider>
  );
  return { saveQueryStub, onCancel };
}

describe('SaveDraftAsFavoriteModal', function () {
  afterEach(cleanup);

  // LG `Button` doesn't render the native HTML `disabled` attribute when
  // `disabled` is set — it uses `aria-disabled` instead. Reading
  // `.disabled` off the DOM node would always return false. We assert
  // on the aria attribute the way LG actually exposes the state.
  function isAriaDisabled(el: HTMLElement) {
    return el.getAttribute('aria-disabled') === 'true';
  }

  function getSubmitButton() {
    // FormModal exposes its primary action button with this stable
    // testid (see compass-components/src/components/modals/form-modal).
    return screen.getByTestId('submit-button');
  }

  function getNameInput() {
    // LG TextInput renders both a labeled wrapper div and the input
    // itself with the same accessible name — getByLabelText finds two.
    // Pin to the input via the `name` attribute we set on the field.
    return document.querySelector(
      'input[name="favorite-name"]'
    ) as HTMLInputElement;
  }

  function getDescriptionTextarea() {
    return document.querySelector(
      'textarea[name="favorite-description"]'
    ) as HTMLTextAreaElement;
  }

  it('the Save button is aria-disabled until a name is entered', async function () {
    await renderModal({});
    expect(isAriaDisabled(getSubmitButton())).to.equal(true);
  });

  it('the Save button is enabled with only Name filled (MCP prompt name is truly optional)', async function () {
    // Regression: the MCP prompt name field is labeled "optional" — it
    // must never block submit when left empty.
    await renderModal({});
    userEvent.type(getNameInput(), 'Just a name');
    expect(isAriaDisabled(getSubmitButton())).to.equal(false);
  });

  it('typing into the input fields does not dismiss the modal', async function () {
    // Regression: an earlier ConfirmationModal-based implementation
    // dismissed the modal mid-typing under some keystrokes. The
    // current `Modal` + plain-Button setup must keep the modal mounted
    // through arbitrary typing.
    await renderModal({});
    userEvent.type(getNameInput(), 'Trips to station 470');
    userEvent.type(getDescriptionTextarea(), 'Some description');
    expect(screen.queryByTestId('save-draft-as-favorite-modal')).to.exist;
  });

  it('Save fires saveDraftAsFavorite with the captured fields and closes the modal on success', async function () {
    const saveQueryStub = Sinon.stub().resolves();
    const onCancel = Sinon.spy();
    await renderModal({ saveQueryStub, onCancel });

    await userEvent.type(getNameInput(), 'My favorite');
    await userEvent.type(getDescriptionTextarea(), 'Useful queries');

    const save = getSubmitButton();
    expect(isAriaDisabled(save)).to.equal(false);
    // Plain click — handleSubmit is wired via the Save button's
    // onClick, no form-submit chain involved. If this ever stops
    // dispatching the thunk on a plain click, something structural
    // changed in the modal and we should investigate before papering
    // over it with a manual submit dispatch.
    userEvent.click(save);

    await waitFor(() => expect(saveQueryStub.callCount).to.equal(1));
    const [payload] = saveQueryStub.firstCall.args;
    expect(payload._name).to.equal('My favorite');
    expect(payload._description).to.equal('Useful queries');
    expect(payload._authoredBy).to.equal('human');
    await waitFor(() => expect(onCancel.callCount).to.equal(1));
  });
});
