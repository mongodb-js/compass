import React, { Component } from 'react';
import { Provider } from 'react-redux';
import PropTypes from 'prop-types';

import Sidebar from 'components/sidebar';
import store from 'stores';

class Plugin extends Component {
  static displayName = 'SidebarPlugin';
  static propTypes = {
    onCollapse: PropTypes.func.isRequired
  };

  /**
   * Connect the Plugin to the store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <Provider store={store}>
        <Sidebar onCollapse={this.props.onCollapse}/>
      </Provider>
    );
  }
}

export default Plugin;
