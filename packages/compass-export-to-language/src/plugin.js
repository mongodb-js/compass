import ExportToLanguage from 'components/export-to-language';
import React, { Component } from 'react';
import { Provider } from 'react-redux';
import store from 'stores';

class Plugin extends Component {
  static displayName = 'ExportToLanguagePlugin';

  /**
   * Connect the Plugin to the store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <Provider store={store}>
        <ExportToLanguage />
      </Provider>
    );
  }
}

export default Plugin;
