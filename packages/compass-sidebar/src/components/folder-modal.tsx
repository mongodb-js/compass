import React, { useCallback, useState } from 'react';
import {
  FormModal,
  TextInput,
  css,
  spacing,
} from '@mongodb-js/compass-components';
import { validateFolderName } from '@mongodb-js/compass-connections/provider';

const textInputStyles = css({
  marginTop: spacing[200],
});

export type FolderModalProps = {
  open: boolean;
  title: string;
  submitButtonText: string;
  /** Pre-filled value, used when renaming an existing folder. */
  initialName?: string;
  /** Names that would clash with the new one; exclude the folder being renamed. */
  existingNames: string[];
  onSubmit(name: string): void;
  onClose(): void;
};

export function FolderModal({
  open,
  title,
  submitButtonText,
  initialName = '',
  existingNames,
  onSubmit,
  onClose,
}: FolderModalProps) {
  const [name, setName] = useState(initialName);
  // Don't complain the name is empty before the user has typed anything.
  const [isDirty, setIsDirty] = useState(false);

  // Re-seed on open so a cancelled edit doesn't leak into the next one; this is
  // done during render rather than in an effect, as React documents:
  // https://react.dev/reference/react/useState#storing-information-from-previous-renders
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setName(initialName);
      setIsDirty(false);
    }
  }

  const error = validateFolderName(name, existingNames);

  const handleSubmit = useCallback(() => {
    setIsDirty(true);
    // The button is only aria-disabled, so Enter in the field can still submit.
    if (error) {
      return;
    }
    onSubmit(name.trim());
  }, [error, name, onSubmit]);

  const showError = isDirty && !!error;

  return (
    <FormModal
      open={open}
      setOpen={onClose}
      title={title}
      submitButtonText={submitButtonText}
      submitDisabled={!!error}
      onSubmit={handleSubmit}
      onCancel={onClose}
    >
      <TextInput
        className={textInputStyles}
        label="Folder name"
        placeholder="e.g. Production clusters"
        value={name}
        onChange={(event) => {
          setIsDirty(true);
          setName(event.currentTarget.value);
        }}
        state={showError ? 'error' : 'none'}
        errorMessage={showError ? error : undefined}
      />
    </FormModal>
  );
}
