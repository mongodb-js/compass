import React, { Component } from 'react';
import classnames from 'classnames';
import { connect } from 'react-redux';
import { nsChanged } from 'modules/ns';

import styles from './import-export.less';

class ImportExport extends Component {
  static displayName = 'ImportExportComponent';

  /**
   * Render ImportExport component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className={classnames(styles['import-export'])}>
        <p>Compass Import/Export Plugin</p>
      </div>
    );
  }
}

/**
 * Map the state of the store to component properties.
 *
 * @param {Object} state - The state.
 *
 * @returns {Object} The mapped properties.
 */
const mapStateToProps = (state) => ({
  ns: state.ns
});

/**
 * Export the connected component as the default.
 */
export default connect(
  mapStateToProps,
  { nsChanged }
)(ImportExport);
