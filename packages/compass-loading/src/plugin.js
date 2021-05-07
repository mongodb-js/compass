import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import Loading from 'components/loading';

/**
 * The loading screen plugin component.
 */
class Plugin extends Component {
  static displayName = 'LoadingPlugin';
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
        <Loading />
      </Provider>
    );
  }
}

export default Plugin;
