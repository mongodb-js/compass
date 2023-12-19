import React from 'react';
import { usePreference } from 'compass-preferences-model';

import DocumentList from './document-list';

function DocumentListWithReadonly(props: any) {
  const preferencesReadonly = usePreference('readOnly', React);
  return (
    <DocumentList
      {...props}
      isEditable={!preferencesReadonly && props.isEditable}
    />
  );
}

export { DocumentListWithReadonly };
