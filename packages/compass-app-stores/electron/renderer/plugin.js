import React, { Component } from 'react';
import { Provider } from 'react-redux';
import InstancePlugin from './component/instance-component';
import NamespacePlugin from './component/namespace-component';
import CollectionPlugin from './component/collection-component';
import { InstanceStore, NamespaceStore, CollectionStore } from 'stores';

class Plugin extends Component {
  static displayName = 'TestPlugin';

  /**
   * Connect the Plugin to the store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div>
        <Provider store={InstanceStore}>
          <InstancePlugin />
        </Provider>
        <Provider store={NamespaceStore}>
          <NamespacePlugin />
        </Provider>
        <Provider store={CollectionStore}>
          <CollectionPlugin />
        </Provider>
      </div>
    );
  }
}

export default Plugin;
