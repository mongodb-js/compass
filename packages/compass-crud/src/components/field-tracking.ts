export type FieldTrackingMode = 'list' | 'table' | 'insert';

export type FieldTrackingProps = {
  trackFieldTypeChanged?: (
    fromType: string,
    toType: string,
    mode: FieldTrackingMode
  ) => void;
  trackFieldEdited?: (type: string, mode: 'list' | 'table') => void;
  trackFieldAdded?: (level: 'top' | 'nested', mode: FieldTrackingMode) => void;
  trackFieldRemoved?: (mode: FieldTrackingMode) => void;
  trackShowMoreFieldsClicked?: () => void;
  trackDocumentUpdateCancelled?: (mode: 'list' | 'json' | 'table') => void;
};
