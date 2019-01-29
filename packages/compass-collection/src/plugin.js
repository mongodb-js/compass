import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Collection from 'components/collection';

class Plugin extends Component {
  static displayName = 'CollectionPlugin';

  static propTypes = {
    namespace: PropTypes.string
  };

  /**
   * Connect the Plugin to the store and render.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (<Collection namespace={this.props.namespace} />);
  }
}

export default Plugin;
