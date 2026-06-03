import React, { useState } from 'react';
import type { MapDispatchToProps, MapStateToProps } from 'react-redux';
import {
  Button,
  FormFieldContainer,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  TextArea,
  TextInput,
  css,
  spacing,
} from '@mongodb-js/compass-components';
import {
  MCP_PROMPT_NAME_HINT,
  validateMcpPromptName,
} from '@mongodb-js/my-queries-storage/provider';
import type { FavoriteQuery } from '@mongodb-js/my-queries-storage/provider';

// Slim shape of just the favorite metadata we read in the modal. We
// declare it locally because the upstream `FavoriteQuery` type can
// resolve to `any` during cross-package builds (when sibling dist
// folders aren't compiled yet), and a wider `any | null` defeats the
// rest of the type checking in this file.
type LoadedFavoriteRef = Pick<FavoriteQuery, '_name'>;
import { connect } from '../stores/context';
import type { RootState } from '../stores/query-bar-store';
import { saveDraftAsFavorite } from '../stores/query-bar-reducer';
import type { SaveModalMode } from './save-query-menu';

interface SaveDraftAsFavoriteModalProps {
  open: boolean;
  /**
   * `save`     — first-time save. Name field starts empty.
   * `save-as`  — saving a sibling of the currently-loaded favorite.
   *              Name field pre-fills with `"<original> (copy)"` so the
   *              user has somewhere meaningful to start, mirroring the
   *              aggregation-builder convention.
   */
  mode: SaveModalMode;
  /**
   * The currently-loaded favorite, if any. Used only to pre-fill the
   * name when `mode === 'save-as'`.
   */
  loadedFavorite: LoadedFavoriteRef | null;
  /**
   * All currently-saved favorite queries — used to surface a live
   * uniqueness warning on the MCP prompt name. Pipelines aren't checked
   * here (out of scope for this package); the main-process storage
   * adapter dedupes against pipelines on read, so a silently-shadowed
   * prompt name is harmless.
   */
  existingFavorites: Pick<FavoriteQuery, '_id' | '_mcpPromptName'>[];
  onSubmit(input: {
    name: string;
    description?: string;
    mcpPromptName?: string;
  }): Promise<boolean>;
  onCancel(): void;
}

const footerStyles = css({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: spacing[200],
});

/**
 * "Save as favorite" dialog reached via the Save dropdown in the query
 * bar. Captures everything we want about a saved query in one go:
 * a memorable name, an optional free-text description (surfaced to AI
 * agents via the MCP catalog), and an optional MCP prompt name (lights
 * up `/<name>` in AI client slash menus).
 *
 * Built with low-level `Modal` + plain `Button`s on purpose. Earlier
 * attempts with `FormModal` / `ConfirmationModal` hit subtle issues
 * with form-submit chains and modal keyboard handling. Using a click
 * handler on the Save button is unambiguous: click → `handleSubmit`.
 * No form-submit, no Enter-key auto-confirm, no surprises.
 */
const SaveDraftAsFavoriteModalImpl: React.FunctionComponent<
  SaveDraftAsFavoriteModalProps
> = ({ open, mode, loadedFavorite, existingFavorites, onSubmit, onCancel }) => {
  // State lives only for the duration of an open instance. The parent
  // (re-)mounts the component when `open` flips from false → true, so
  // we never need to reset state ourselves.
  //
  // For Save As against a loaded favorite, seed Name with
  // "<original> (copy)" — same convention the aggregation builder uses,
  // and concrete enough that the user doesn't have to type from scratch.
  const initialName =
    mode === 'save-as' && loadedFavorite
      ? `${loadedFavorite._name} (copy)`
      : '';
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState('');
  const [mcpPromptName, setMcpPromptName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Live validation for the MCP prompt name: format + uniqueness across
  // favorites this package can see.
  // Note: empty value short-circuits to `null` — the field is genuinely
  // optional, never required.
  const promptNameError: string | null = (() => {
    if (mcpPromptName.length === 0) return null;
    const formatErr = validateMcpPromptName(mcpPromptName);
    if (formatErr) return formatErr;
    const collides = existingFavorites.some(
      (other) => other._mcpPromptName === mcpPromptName
    );
    if (collides) return 'Already in use by another saved favorite.';
    return null;
  })();

  const isSubmitDisabled =
    !name.trim() || promptNameError !== null || submitting;

  const handleSubmit = () => {
    if (isSubmitDisabled) return;
    setSubmitting(true);
    void onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      mcpPromptName: mcpPromptName.trim() || undefined,
    }).then((ok) => {
      // Only close on success; on failure the dialog stays open so the
      // user can see the validation state. (Failures from this thunk
      // today are silent — they just return false — and primarily mean
      // "empty query attributes," which the parent button should have
      // prevented. Defensive fallback regardless.)
      if (ok) onCancel();
      else setSubmitting(false);
    });
  };

  return (
    <Modal
      open={open}
      setOpen={onCancel}
      data-testid="save-draft-as-favorite-modal"
    >
      <ModalHeader title="Save query as favorite" />
      <ModalBody>
        <FormFieldContainer>
          <TextInput
            aria-label="Name"
            label="Name"
            name="favorite-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </FormFieldContainer>

        <FormFieldContainer>
          <TextArea
            aria-label="Description"
            label="Description (optional)"
            description="Surfaced to AI agents via the MCP catalog. Without a description, this saved query is hidden from the AI."
            name="favorite-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </FormFieldContainer>

        <FormFieldContainer>
          <TextInput
            aria-label="MCP prompt name"
            label="MCP prompt name (optional)"
            description={`When set, surfaces this saved query as a slash command in AI clients — e.g. /${
              mcpPromptName || 'search-trips'
            }. ${MCP_PROMPT_NAME_HINT}`}
            name="favorite-mcp-prompt-name"
            value={mcpPromptName}
            state={promptNameError ? 'error' : 'none'}
            errorMessage={promptNameError ?? undefined}
            onChange={(event) => setMcpPromptName(event.target.value)}
          />
        </FormFieldContainer>
      </ModalBody>
      <ModalFooter className={footerStyles}>
        <Button
          data-testid="cancel-button"
          variant="default"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          data-testid="submit-button"
          variant="primary"
          disabled={isSubmitDisabled}
          onClick={handleSubmit}
        >
          Save
        </Button>
      </ModalFooter>
    </Modal>
  );
};

const mapState: MapStateToProps<
  Pick<SaveDraftAsFavoriteModalProps, 'existingFavorites' | 'loadedFavorite'>,
  Pick<SaveDraftAsFavoriteModalProps, 'open' | 'mode' | 'onCancel'>,
  RootState
> = (state) => ({
  existingFavorites: state.queryBar.favoriteQueries,
  loadedFavorite:
    state.queryBar.favoriteQueries.find(
      (f) => f._id === state.queryBar.loadedFavoriteId
    ) ?? null,
});

const mapDispatch: MapDispatchToProps<
  Pick<SaveDraftAsFavoriteModalProps, 'onSubmit'>,
  Pick<SaveDraftAsFavoriteModalProps, 'open' | 'onCancel'>
> = {
  onSubmit: saveDraftAsFavorite,
};

export const SaveDraftAsFavoriteModal = connect(
  mapState,
  mapDispatch
)(SaveDraftAsFavoriteModalImpl);
