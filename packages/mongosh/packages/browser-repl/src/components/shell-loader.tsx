import React, { Component } from 'react';
import classnames from 'classnames';

const styles = require('./shell-loader.less');

interface ShellLoaderProps {
  className: string;
  size?: string;
}

export default class ShellLoader extends Component<ShellLoaderProps> {
  static defaultProps = {
    className: '',
    size: '12px'
  };

  render(): JSX.Element {
    const {
      className,
      size
    } = this.props;

    return (
      <div
        className={classnames(
          className,
          styles['shell-loader']
        )}
        style={{
          width: size,
          height: size
        }}
      />
    );
  }
}
