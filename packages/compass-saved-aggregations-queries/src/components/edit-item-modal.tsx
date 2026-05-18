import React, { useState } from 'react';
import {
  FormFieldContainer,
  FormModal,
  TextArea,
  TextInput,
  useSyncStateOnPropChange,
} from '@mongodb-js/compass-components';
import {
  MCP_PROMPT_NAME_HINT,
  validateMcpPromptName,
} from '@mongodb-js/my-queries-storage/provider';
import { connect } from 'react-redux';
import type { MapDispatchToProps, MapStateToProps } from 'react-redux';
import type { RootState } from '../stores';
import type { UpdateItemAttributes } from '../stores/edit-item';
import type { Item } from '../stores/aggregations-queries-items';
import { cancelEditItem, updateItem } from '../stores/edit-item';

type EditItemModalProps = {
  isModalOpen: boolean;
  item?: Item;
  /** All other items (used for prompt-name uniqueness check). */
  otherItems: Item[];
  onSubmit(id: string, attributes: UpdateItemAttributes): void;
  onCancel: () => void;
};

/**
 * Extract the saved item's current description regardless of which storage
 * type it lives in (queries use `_description`, pipelines use `description`).
 */
function getDescription(item: Item | undefined): string {
  if (!item) return '';
  if (item.type === 'aggregation') return item.aggregation.description ?? '';
  return item.query._description ?? '';
}

/** Same for the MCP prompt name (`_mcpPromptName` vs `mcpPromptName`). */
function getMcpPromptName(item: Item | undefined): string {
  if (!item) return '';
  if (item.type === 'aggregation') return item.aggregation.mcpPromptName ?? '';
  return item.query._mcpPromptName ?? '';
}

/**
 * Returns the MCP prompt name currently assigned to a given item, if any.
 * Used by the uniqueness check below.
 */
function promptNameOf(item: Item): string | undefined {
  if (item.type === 'aggregation') return item.aggregation.mcpPromptName;
  return item.query._mcpPromptName;
}

const EditItemModal: React.FunctionComponent<EditItemModalProps> = ({
  isModalOpen,
  item,
  otherItems,
  onSubmit,
  onCancel,
}) => {
  const [name, setName] = useState(item?.name ?? '');
  const [description, setDescription] = useState(getDescription(item));
  const [mcpPromptName, setMcpPromptName] = useState(getMcpPromptName(item));

  // Re-sync local state when a different item is opened in the modal.
  useSyncStateOnPropChange(() => {
    setName(item?.name ?? '');
    setDescription(getDescription(item));
    setMcpPromptName(getMcpPromptName(item));
  }, [item]);

  // Validate prompt-name input live. Two failure modes: bad format, or
  // collision with another item's prompt name. Both surface as the LG
  // TextInput `errorMessage`.
  const promptNameError: string | null = (() => {
    if (mcpPromptName.length === 0) return null;
    const formatErr = validateMcpPromptName(mcpPromptName);
    if (formatErr) return formatErr;
    const collides = otherItems.some(
      (other) => promptNameOf(other) === mcpPromptName
    );
    if (collides) return 'Already in use by another saved item.';
    return null;
  })();

  const dirty =
    name !== (item?.name ?? '') ||
    description !== getDescription(item) ||
    mcpPromptName !== getMcpPromptName(item);

  const isSubmitDisabled = !name || !dirty || promptNameError !== null;

  const onSubmitForm = () => {
    if (isSubmitDisabled || !item) return;
    onSubmit(item.id, {
      name,
      description,
      mcpPromptName,
    });
  };

  return (
    <FormModal
      open={isModalOpen}
      onCancel={onCancel}
      onSubmit={onSubmitForm}
      submitButtonText="Update"
      submitDisabled={isSubmitDisabled}
      title={`Edit ${item?.type ?? ''}`}
      data-testid="edit-item-modal"
    >
      <FormFieldContainer>
        <TextInput
          aria-label="Name"
          label="Name"
          name="name"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
          }}
        />
      </FormFieldContainer>

      <FormFieldContainer>
        <TextArea
          aria-label="Description"
          label="Description (optional)"
          description="Surfaced to AI agents via the MCP catalog. Without a description, this saved item is hidden from the AI."
          name="description"
          value={description}
          onChange={(event) => {
            setDescription(event.target.value);
          }}
        />
      </FormFieldContainer>

      <FormFieldContainer>
        <TextInput
          aria-label="MCP prompt name"
          label="MCP prompt name (optional)"
          description={`When set, surfaces this saved item as a slash command in AI clients — e.g. \`/${
            mcpPromptName || 'search-trips'
          }\`. ${MCP_PROMPT_NAME_HINT}`}
          name="mcp-prompt-name"
          value={mcpPromptName}
          state={promptNameError ? 'error' : 'none'}
          errorMessage={promptNameError ?? undefined}
          onChange={(event) => {
            setMcpPromptName(event.target.value);
          }}
          // Soft-restrict to allowed characters: anything the user types is
          // funneled through validateMcpPromptName for the actual error
          // message, but stripping obvious garbage on the fly makes the
          // input feel more deliberate.
          onBlur={() => {
            // Trim whitespace on blur — the rest of the validation runs
            // synchronously above.
            const trimmed = mcpPromptName.trim();
            if (trimmed !== mcpPromptName) setMcpPromptName(trimmed);
          }}
        />
      </FormFieldContainer>
    </FormModal>
  );
};

const mapState: MapStateToProps<
  Pick<EditItemModalProps, 'isModalOpen' | 'item' | 'otherItems'>,
  Record<string, never>,
  RootState
> = ({ editItem: { id }, savedItems: { items } }) => {
  const item = items.find((x) => x.id === id);
  return {
    isModalOpen: Boolean(id),
    item,
    otherItems: item ? items.filter((x) => x.id !== item.id) : [],
  };
};

const mapDispatch: MapDispatchToProps<
  Pick<EditItemModalProps, 'onSubmit' | 'onCancel'>,
  Record<string, never>
> = {
  onSubmit: updateItem,
  onCancel: cancelEditItem,
};

export default connect(mapState, mapDispatch)(EditItemModal);
