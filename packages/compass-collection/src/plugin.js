import React, { Component } from 'react';
import Collection from 'components/collection';

class Plugin extends Component {
  static displayName = 'CollectionPlugin';

  /**
   * Connect the Plugin to the store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (<Collection />);
  }
}

export default Plugin;
