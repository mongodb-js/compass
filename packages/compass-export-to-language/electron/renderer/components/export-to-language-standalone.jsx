import React, { Component } from 'react';
import ExportToLanguagePlugin, { activate } from 'plugin';
import PropTypes from 'prop-types';


class ExportToLanguageStandalone extends Component {
  static displayName = 'ExportToLanguageStandaloneComponent';
  static propTypes = {
    appRegistry: PropTypes.object.isRequired,
    store: PropTypes.object.isRequired
  };

  handleFilterChange = (event) => {
    if (event.keyCode === 13) {
      try {
        this.props.appRegistry.emit(
          'open-query-export-to-language',
          {filter: event.target.value}
        );
      } catch(err) {
        console.log('Invalid input:' + err.message);
      }
    }
  };
  handleAggChange = (event) => {
    if (event.keyCode === 13) {
      try {
        this.props.appRegistry.emit(
          'open-aggregation-export-to-language',
          event.target.value
        );
      } catch(err) {
        console.log('Invalid input:' + err.message);
      }
    }
  };

  /**
   * Render ExportToLanguage Standalone component, for testing.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div>
        <div data-test-id="export-to-language-standalone">
          Input filter (press enter to run)
          <input type="text" name="input filter" onKeyUp={this.handleFilterChange}/>
          Input aggregation (press enter to run)
          <input type="text" name="input aggregation" onKeyUp={this.handleAggChange}/>
        </div>
        <div>
          <ExportToLanguagePlugin store={this.props.store} />
        </div>
      </div>
    );
  }
}

export default ExportToLanguageStandalone;
