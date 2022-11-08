import ExportToLanguage from './components/modal';
import React, { Component } from 'react';
import { Provider } from 'react-redux';
import PropTypes from 'prop-types';

class Plugin extends Component {
  static displayName = 'ExportToLanguagePlugin';
  static propTypes = {
    store: PropTypes.object.isRequired,
  };

  /**
   * Connect the Plugin to the store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <Provider store={this.props.store}>
        <ExportToLanguage />
      </Provider>
    );
  }
}

export default Plugin;
