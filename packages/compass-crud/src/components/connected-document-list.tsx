import React from 'react';
import { StoreConnector } from '@mongodb-js/compass-components';
import { usePreference } from 'compass-preferences-model';

import DocumentList, { type DocumentListProps } from './document-list';
import type { CrudStore } from '../stores/crud-store';

function DocumentListWithReadonly(props: DocumentListProps) {
  const preferencesReadonly = usePreference('readOnly', React);
  return (
    <DocumentList
      {...props}
      shardKey={(props as any).shardKeys}
      isEditable={!preferencesReadonly && props.isEditable}
    />
  );
}

function ConnectedDocumentList({
  store,
  actions,
  ...props
}: {
  store: CrudStore;
  actions: Partial<DocumentListProps>;
} & Omit<DocumentListProps, 'store'>) {
  return (
    <StoreConnector store={store}>
      <DocumentListWithReadonly
        {...actions}
        {...props}
        store={store}
        isExportable
      />
    </StoreConnector>
  );
}

export { ConnectedDocumentList };
