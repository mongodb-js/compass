import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { reset } from 'modules/namespace/reset';

class TestPlugin extends Component {
  static displayName = 'NamespaceComponent';

  static propTypes = {
    ns: PropTypes.string.isRequired,
    reset: PropTypes.func.isRequired
  };

  onReset() {
    this.props.reset();
  }

  refreshData() {
    global.hadronApp.appRegistry.getStore('App.NamespaceStore').ns = 'newDB.newColl';
  }

  /**
   * Render TestPlugin component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div style={{backgroundColor: '#d1ed6d'}}>
        <h2> NamespaceStore Tester</h2>
        <p></p>
        <p>The namespace is: <code>{this.props.ns}</code></p>
        <button onClick={this.onReset.bind(this)}>Reset</button>
        <button onClick={this.refreshData.bind(this)}>Set Name</button>
      </div>
    );
  }
}

/**
 * Map the store state to properties to pass to the components.
 *
 * @param {Object} state - The store state.
 *
 * @returns {Object} The mapped properties.
 */
const mapStateToProps = (state) => ({
  ns: state.ns
});

/**
 * Connect the redux store to the component.
 * (dispatch)
 */
const MappedTestPlugin = connect(
  mapStateToProps,
  {
    reset
  },
)(TestPlugin);

export default MappedTestPlugin;
export { TestPlugin };
