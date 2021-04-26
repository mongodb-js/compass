import React, { Component } from 'react';
import classnames from 'classnames';

const styles = require('./password-prompt.less');

interface PasswordPromptProps {
  onFinish: (result: string) => void;
  onCancel: () => void;
  prompt: string;
}

export class PasswordPrompt extends Component<PasswordPromptProps> {
  constructor(props: PasswordPromptProps) {
    super(props);
  }

  onKeyDown = (ev: React.KeyboardEvent<HTMLInputElement>): void => {
    switch (ev.key) {
      case 'Enter':
        this.props.onFinish((ev.target as HTMLInputElement).value);
        break;
      case 'Esc':
      case 'Escape':
        this.props.onCancel();
        break;
      default:
        break;
    }
  };

  render(): JSX.Element {
    const className = classnames(styles['password-prompt']);

    return (
      <label className={className}>
        {this.props.prompt}:&nbsp;
        <input type="password" onKeyDown={this.onKeyDown} autoFocus />
      </label>);
  }
}
