import React from 'react';
import PropTypes from 'prop-types';
// @ts-expect-error No ts definitions for hadron-react-components
import { StoreConnector } from 'hadron-react-components';
import DocumentList from './document-list';
import { usePreference } from 'compass-preferences-model';

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
  store: unknown;
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

ConnectedDocumentList.displayName = 'ConnectedDocumentList';
ConnectedDocumentList.propTypes = {
  store: PropTypes.object.isRequired,
  actions: PropTypes.object.isRequired,
};

export default ConnectedDocumentList;
