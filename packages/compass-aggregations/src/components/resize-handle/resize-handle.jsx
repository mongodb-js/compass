import React, { PureComponent } from 'react';

import styles from './resize-handle.module.less';

export default class ResizeHandle extends PureComponent {
  render() {
    return (
      <div
        className={styles['resize-handle']}
      />
    );
  }
}
