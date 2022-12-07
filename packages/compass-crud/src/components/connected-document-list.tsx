import React from 'react';
import { StoreConnector } from '@mongodb-js/compass-components';
import { usePreference } from 'compass-preferences-model';
import type Reflux from 'reflux';

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

function ConnectedDocumentList({
  store,
  actions,
  ...props
}: {
  store: Reflux.Store & {
    getInitialState: () => unknown;
  };
  actions: unknown & object;
}) {
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
