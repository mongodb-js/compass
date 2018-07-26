import React, { Component } from 'react';
import ExportToLanguagePlugin, { activate } from 'plugin';
import PropTypes from 'prop-types';

class ExportToLanguageStandalone extends Component {
  static displayName = 'ExportToLanguageStandaloneComponent';
  static propTypes = {
    appRegistry: PropTypes.object.isRequired
  };
  
  handleChange = (event) => {
    if (event.keyCode === 13) {
      try {
        const doc = eval(`(${event.target.value})`);
        this.props.appRegistry.emit('open-aggregation-export-to-language', doc);
      } catch(err) {
        console.log('Invalid input:' + err.message);
      }
    }
  }
  /**
   * Render ExportToLanguage Standalone component, for testing.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div>
        <div data-test-id="export-to-language-standalone">
          Input code (press enter to run)
          <input type="text" name="input code" onKeyUp={this.handleChange}/>
        </div>
        <div>
          <ExportToLanguagePlugin/>
        </div>
      </div>
    );
  }
}

export default ExportToLanguageStandalone;
