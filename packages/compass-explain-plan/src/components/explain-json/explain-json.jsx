import React, { Component } from 'react';
import PropTypes from 'prop-types';
import HadronDocument from 'hadron-document';
import { Document } from '@mongodb-js/compass-crud';

import styles from './explain-json.module.less';

/**
 * The ExplainJSON component.
 */
class ExplainJSON extends Component {
  static displayName = 'ExplainJSONComponent';

  static propTypes = {
    originalExplainData: PropTypes.object.isRequired,
  };

  copyToClipboard = () => {
    navigator.clipboard.writeText(
      JSON.stringify(this.props.originalExplainData)
    );
  };

  /**
   * Renders ExplainJSON component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    const doc = new HadronDocument(this.props.originalExplainData);

    return (
      <div className={styles['explain-json']}>
        <ol className={styles['document-list']}>
          <Document
            copyToClipboard={this.copyToClipboard}
            doc={doc}
            expandAll
          />
        </ol>
      </div>
    );
  }
}

export default ExplainJSON;
