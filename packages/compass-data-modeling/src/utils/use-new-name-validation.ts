import { useMemo } from 'react';

export function useNewNameValidation({
  newName,
  existingNames,
  currentName,
  entity,
}: {
  newName: string;
  existingNames: string[];
  currentName: string;
  entity: string;
}): {
  isValid: boolean;
  errorMessage?: string;
} {
  return useMemo(() => {
    if (newName.trim().length === 0) {
      return {
        isValid: false,
        errorMessage: `${entity} name cannot be empty.`,
      };
    }

    const existingNamesWithoutCurrent = existingNames.filter(
      (name) => name !== currentName
    );

    const isDuplicate = existingNamesWithoutCurrent.some(
      (name) => name.trim() === newName.trim()
    );

    return {
      isValid: !isDuplicate,
      errorMessage: isDuplicate ? `${entity} name must be unique.` : undefined,
    };
  }, [newName, existingNames, currentName, entity]);
}
