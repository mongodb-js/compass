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
  /**
   * Names that would clash with the new one. When renaming, this must exclude
   * the folder being renamed so keeping its own name isn't reported as a
   * duplicate.
   */
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
  // Validation only surfaces once the user has interacted with the field, so
  // the form doesn't open already complaining that the name is empty.
  const [isDirty, setIsDirty] = useState(false);

  // Re-seed the form whenever the modal opens, so a cancelled edit doesn't leak
  // into the next one. Adjusting state during render is the documented
  // alternative to an effect here:
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
