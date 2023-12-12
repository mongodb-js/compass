import React from 'react';
import { StoreConnector } from '@mongodb-js/compass-components';

import CompassSchema from './components/compass-schema';

export function ConnectedSchema({
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
      {/* @ts-expect-error reflux */}
      <CompassSchema {...actions} {...props} store={store} actions={actions} />
    </StoreConnector>
  );
}
