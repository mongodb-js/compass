import React, { Component } from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';

const styles = require('./line-with-icon.less');

interface LineWithIconProps {
  icon: JSX.Element;
  className?: string;
}

export class LineWithIcon extends Component<LineWithIconProps> {
  static propTypes = {
    icon: PropTypes.object.isRequired,
    className: PropTypes.string
  };

  render(): JSX.Element {
    return (<div className={classnames(this.props.className, styles['line-with-icon'])}>
      <span className={classnames(styles['line-with-icon-icon'])}>
        {this.props.icon}
      </span>
      <div className={classnames(styles['line-with-icon-content'])}>
        {this.props.children}
      </div>
    </div>);
  }
}


