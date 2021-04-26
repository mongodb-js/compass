import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { changeFields } from 'modules';
import { reset } from 'modules/reset';

class TestPlugin extends Component {
  static displayName = 'TestPluginComponent';

  static propTypes = {
    fields: PropTypes.object.isRequired,
    topLevelFields: PropTypes.array.isRequired,
    aceFields: PropTypes.array.isRequired,
    changeFields: PropTypes.func.isRequired,
    reset: PropTypes.func.isRequired
  };

  onReset() {
    this.props.reset();
  };

  onChangeFields() {
    global.hadronApp.appRegistry.emit('document-inserted', null, {harry: 1, potter: true});
  };

  /**
   * Render TestPlugin component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div>
        <h2>TestPlugin Plugin</h2>
        <p></p>
        <p>The current status is: <code>{JSON.stringify(this.props)}</code></p>
        <button onClick={this.onReset.bind(this)}>Reset</button>
        <button onClick={this.onChangeFields.bind(this)}>Change Fields</button>
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
  fields: state.fields,
  topLevelFields: state.topLevelFields,
  aceFields: state.aceFields
});

/**
 * Connect the redux store to the component.
 * (dispatch)
 */
const MappedTestPlugin = connect(
  mapStateToProps,
  {
    changeFields,
    reset
  },
)(TestPlugin);

export default MappedTestPlugin;
export { TestPlugin };
