import { LeafyGreenProvider } from '@mongodb-js/compass-components';
import React from 'react';
import type { Store } from 'reflux';
import { StoreConnector } from 'hadron-react-components';

import CollectionStats from './components/collection-stats';

interface CollectionStatsPluginProps {
  store: Store;
  documentCount: string;
  storageSize: string;
  avgDocumentSize: string;
  indexCount: string;
  totalIndexSize: string;
  avgIndexSize: string;
  isReadonly?: boolean;
  isTimeSeries?: boolean;
  isEditing?: boolean;
}

/**
 * Connect the Plugin to the store and render.
 *
 * @returns {React.Component} The rendered component.
 */
const Plugin: React.FunctionComponent<CollectionStatsPluginProps> = (
  props: CollectionStatsPluginProps
) => {
  return (
    // The way Compass requires to extend redux store is not compatible with
    // redux types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <LeafyGreenProvider>
      <StoreConnector store={props.store}>
        <CollectionStats {...props} />
      </StoreConnector>
    </LeafyGreenProvider>
  );
};

export default Plugin;
