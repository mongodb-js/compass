import React from 'react';
import { StoreConnector, css } from '@mongodb-js/compass-components';
import { usePreference } from 'compass-preferences-model';
import type Reflux from 'reflux';

import DocumentList from './document-list';
import type { CollectionTabPluginMetadata } from '@mongodb-js/compass-collection';

function DocumentListWithReadonly(props: any) {
  const preferencesReadonly = usePreference('readOnly', React);
  return (
    <DocumentList
      {...props}
      isEditable={!preferencesReadonly && props.isEditable}
    />
  );
}

const containerStyles = css({
  display: 'flex',
  flex: 1,
  minHeight: 0,
});

function ConnectedDocumentList({
  store,
  actions,
  isActive,
  ...props
}: Pick<CollectionTabPluginMetadata, 'isActive'> & {
  store: Reflux.Store & {
    getInitialState: () => unknown;
  };
  actions: unknown & object;
}) {
  if (!isActive) {
    return null;
  }

  return (
    <StoreConnector store={store}>
      <div className={containerStyles} data-testid="documents-content">
        <DocumentListWithReadonly
          {...actions}
          {...props}
          store={store}
          isExportable
        />
      </div>
    </StoreConnector>
  );
}

export { ConnectedDocumentList };
