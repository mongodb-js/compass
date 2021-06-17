import React, { Component } from 'react';
import PropTypes from 'prop-types';
import HadronDocument from 'hadron-document';
import { Document } from '@mongodb-js/compass-crud';

import styles from './explain-json.less';

/**
 * The ExplainJSON component.
 */
class ExplainJSON extends Component {
  static displayName = 'ExplainJSONComponent';

  static propTypes = {
    rawExplainObject: PropTypes.object.isRequired
  }

  /**
   * Renders ExplainJSON component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    const doc = new HadronDocument(this.props.rawExplainObject.originalData);

    return (
      <div className={styles['explain-json']}>
        <div className="panel panel-default">
          <div className={styles['panel-body']}>
            <ol className={styles['document-list']}>
              <Document doc={doc} expandAll />
            </ol>
          </div>
        </div>
      </div>
    );
  }
}

export default ExplainJSON;
