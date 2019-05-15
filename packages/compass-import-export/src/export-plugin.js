import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import ExportModal from 'components/export-modal';

class ExportPlugin extends Component {
  static displayName = 'ExportPlugin';
  static propTypes = {
    store: PropTypes.object.isRequired
  }

  /**
   * Connect the Plugin to the store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <Provider store={this.props.store}>
        <ExportModal />
      </Provider>
    );
  }
}

export default ExportPlugin;
