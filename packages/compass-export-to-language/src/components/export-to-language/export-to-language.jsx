import { runQuery, copyQuery, clearCopy} from 'modules/export-query';
import ExportModal from 'components/export-modal';
import React, { Component } from 'react';
import { connect } from 'react-redux';

class ExportToLanguage extends Component {
  static displayName = 'ExportToLanguageComponent';

  /**
   * Render ExportToLanguage component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div>
        <ExportModal {...this.props} />
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
  exportQuery: state.exportQuery
});

/**
 * Connect the redux store to the component.
 * (dispatch)
 */
const MappedExportToLanguage = connect(
  mapStateToProps,
  {
    copyQuery,
    clearCopy,
    runQuery
  },
)(ExportToLanguage);

export default MappedExportToLanguage;
