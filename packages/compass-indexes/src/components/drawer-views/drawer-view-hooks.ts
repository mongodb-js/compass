import { useCallback, useEffect, useRef } from 'react';

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
 * Hook that returns a text change handler for the index definition editor.
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
