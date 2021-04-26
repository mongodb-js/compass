import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { reset } from 'modules/collection/reset';

class TestPlugin extends Component {
  static displayName = 'CollectionComponent';

  static propTypes = {
    activeTabIndex: PropTypes.number.isRequired,
    collection: PropTypes.object.isRequired,
    tabs: PropTypes.array.isRequired,
    reset: PropTypes.func.isRequired
  };

  onReset() {
    this.props.reset();
  }

  setColl() {
    global.hadronApp.appRegistry.getStore('App.CollectionStore').setCollection({
      _id: 'newCollId',
      readonly: true,
      capped: true
    });
  }
  setAI() {
    global.hadronApp.appRegistry.getStore('App.CollectionStore').setActiveTab(this.props.activeTabIndex + 1);
  }
  setTabs() {
    global.hadronApp.appRegistry.getStore('App.CollectionStore').setTabs(['a', 'b', 'c']);
  }

  /**
   * Render TestPlugin component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div style={{backgroundColor: '#fce51b'}}>
        <h2> CollectionStore Tester</h2>
        <p></p>
        <p>The collection is: <code>{JSON.stringify(this.props.collection)}</code></p>
        <p>The activeTabIndex is: <code>{this.props.activeTabIndex}</code></p>
        <p>The tabs array is: <code>{JSON.stringify(this.props.tabs)}</code></p>
        <button onClick={this.onReset.bind(this)}>Reset</button>
        <button onClick={this.setColl.bind(this)}>Set Collection</button>
        <button onClick={this.setAI.bind(this)}>Set Active Index</button>
        <button onClick={this.setTabs.bind(this)}>Set Tabs</button>
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
  activeTabIndex: state.activeTabIndex,
  collection: state.collection,
  tabs: state.tabs
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
