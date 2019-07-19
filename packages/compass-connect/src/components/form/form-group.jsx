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
    const classnamesProps = [styles['form-group']];

    if (this.props.separator) {
      classnamesProps.push(styles['form-group-separator']);
    }

    return classnames(...classnamesProps);
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
