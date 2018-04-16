import ExportModal from 'components/export-modal';
import React, { Component } from 'react';
import { runQuery, copyToClipboard } from 'modules/export-query';
import { connect } from 'react-redux';
import classnames from 'classnames';
import PropTypes from 'prop-types';

import styles from './export-to-language.less';

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
    copyToClipboard,
    runQuery
  },
)(ExportToLanguage);

export default MappedExportToLanguage;
