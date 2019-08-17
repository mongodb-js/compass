import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import styles from '../connect.less';

class FormGroup extends React.PureComponent {
  static displayName = 'FormGroup';

  static propTypes = {
    id: PropTypes.string,
    separator: PropTypes.bool,
    children: PropTypes.oneOfType([PropTypes.array, PropTypes.object])
  };

  getClassName() {
    const classNames = {
      [styles['form-group']]: true,
      [styles['form-group-separator']]: this.props.separator
    };

    return classnames(classNames);
  }

  render() {
    return (
      <div id={this.props.id} className={this.getClassName()}>
        {this.props.children}
      </div>
    );
  }
}

export default FormGroup;
