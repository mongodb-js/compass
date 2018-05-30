import React, { PureComponent } from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';

import styles from './select-lang.less';

class SelectLang extends PureComponent {
  static displayName = 'SelectLangComponent';

  static propTypes = {
  }

  render() {
    return (
      <div className={classnames(styles['input-refresh'])}>
      </div>
    );
  }
}

export default SelectLang;
