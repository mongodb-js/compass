import React, { PureComponent } from 'react';
import classnames from 'classnames';

import styles from './select-lang.less';

class SelectLang extends PureComponent {
  static displayName = 'SelectLangComponent';

  render() {
    return (
      <div className={classnames(styles['input-refresh'])}>
      </div>
    );
  }
}

export default SelectLang;
