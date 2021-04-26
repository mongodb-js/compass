import React, { Component } from 'react';
import Database from 'components/database';

class Plugin extends Component {
  static displayName = 'DatabasePlugin';

  /**
   * Connect the Plugin to the store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (<Database />);
  }
}

export default Plugin;
