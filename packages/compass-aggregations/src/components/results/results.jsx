import React, { Component } from 'react';
import { DocumentList } from '@mongodb-js/compass-crud';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import styles from './results.less';

/**
 * Displays pipeline results.
 */
class Results extends Component {
  static displayName = 'ResultsComponent';

  static propTypes = {
    results: PropTypes.object.isRequired
  }

  /**
   * Render the pipeline results.
   *
   * @returns {Component} The component.
   */
  render() {
    return (
      <div className={classnames(styles.results)}>
        <DocumentList
          docs={this.props.results.docs}
          isEditable={false}
          isExportable={false}
          page={0}
          start={0}
          end={0}
          count={0}
          view="List"
          refreshDocuments={() => {}}
          pageLoadedListenable={{ listen: () => {}}}
          getNextPage={() => {}}
          getPrevPage={() => {}}
          viewChanged={() => {}}/>
      </div>
    );
  }
}

export default Results;
