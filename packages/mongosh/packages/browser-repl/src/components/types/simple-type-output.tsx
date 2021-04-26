import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { SyntaxHighlight } from '../utils/syntax-highlight';
import { inspect } from '../utils/inspect';

interface SimpleTypeOutputProps {
  value: any;
  raw?: boolean;
}

export class SimpleTypeOutput extends Component<SimpleTypeOutputProps> {
  static propTypes = {
    value: PropTypes.any,
    raw: PropTypes.bool
  };

  render(): JSX.Element {
    const asString = this.props.raw ? this.props.value : inspect(this.props.value);
    return (<SyntaxHighlight code={asString} />);
  }
}

