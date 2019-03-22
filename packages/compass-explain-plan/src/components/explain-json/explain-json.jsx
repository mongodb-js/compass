import React, { Component } from 'react';
import classnames from 'classnames';
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
    const doc = new HadronDocument(this.props.rawExplainObject);

    return (
      <div className={classnames(styles['explain-json'])}>
        <div className="panel panel-default">
          <div className={classnames(styles['panel-body'])}>
            <ol className={classnames(styles['document-list'])}>
              <Document doc={doc} expandAll />
            </ol>
          </div>
        </div>
      </div>
    );
  }
}

export default ExplainJSON;
