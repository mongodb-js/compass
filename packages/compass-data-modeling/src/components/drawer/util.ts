import type { TranslateFn } from '@mongodb-js/compass-components';

export function getIsNewNameValid({
  newName,
  existingNames,
  currentName,
  entity,
  t,
}: {
  newName: string;
  existingNames: string[];
  currentName: string;
  entity: 'Diagram' | 'Collection';
  t: TranslateFn;
}): {
  isValid: boolean;
  errorMessage?: string;
} {
  if (newName.trim().length === 0) {
    return {
      isValid: false,
      errorMessage:
        entity === 'Diagram'
          ? t(
              'dataModeling.validation.diagramNameEmpty',
              'Diagram name cannot be empty.'
            )
          : t(
              'dataModeling.validation.collectionNameEmpty',
              'Collection name cannot be empty.'
            ),
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
    errorMessage: isDuplicate
      ? entity === 'Diagram'
        ? t(
            'dataModeling.validation.diagramNameUnique',
            'Diagram name must be unique.'
          )
        : t(
            'dataModeling.validation.collectionNameUnique',
            'Collection name must be unique.'
          )
      : undefined,
  };
}
