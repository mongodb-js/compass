import { useCallback, useEffect, useRef } from 'react';
import { showConfirmation } from '@mongodb-js/compass-components';

/**
 * Hook that calls `onSuccess` when an async operation completes successfully.
 * Detects success by watching `isBusy` transition from `true` to `false` with no `error`.
 */
export function useOnAsyncSuccess(
  isBusy: boolean,
  error: string | undefined,
  onSuccess: () => void
): void {
  const prevIsBusyRef = useRef(isBusy);

  useEffect(() => {
    if (prevIsBusyRef.current && !isBusy && !error) {
      onSuccess();
    }
    prevIsBusyRef.current = isBusy;
  }, [isBusy, error, onSuccess]);
}

/**
 * Hook that returns a cancel handler which shows a confirmation dialog if there are unsaved changes.
 */
export function useConfirmCancel(
  isEditing: boolean,
  onClose: () => void
): () => Promise<void> {
  return useCallback(async () => {
    if (isEditing) {
      const isConfirmed = await showConfirmation({
        title: 'Any unsaved progress will be lost',
        buttonText: 'Discard',
        variant: 'danger',
        description: 'Are you sure you want to continue?',
      });
      if (!isConfirmed) {
        return;
      }
    }
    onClose();
  }, [isEditing, onClose]);
}

/**
 * Hook that returns a text change handler for the index definition editor.
 * Marks the form as editing and validates the definition.
 */
export function useIndexDefinitionChange(
  setIndexDefinition: (definition: string) => void,
  onIndexDefinitionEdit: (isEditing: boolean) => void
): (newDefinition: string) => void {
  return useCallback(
    (newDefinition: string) => {
      onIndexDefinitionEdit(true);
      setIndexDefinition(newDefinition);
    },
    [setIndexDefinition, onIndexDefinitionEdit]
  );
}
