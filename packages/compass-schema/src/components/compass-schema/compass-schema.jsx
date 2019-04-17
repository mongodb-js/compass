import React, { Component } from 'react';
import classnames from 'classnames';

import styles from './compass-schema.less';

class CompassSchema extends Component {
  static displayName = 'CompassSchemaComponent';

  /**
   * Render CompassSchema component.
   *
   * @returns {React.Component} The rendered component.
   */
  render() {
    return (
      <div className={classnames(styles.root)}>
      </div>
    );
  }
}

export default CompassSchema;
