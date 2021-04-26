import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { SyntaxHighlight } from '../utils/syntax-highlight';
import { inspect } from '../utils/inspect';

interface ObjectOutputProps {
  value: any;
}

export class ObjectOutput extends Component<ObjectOutputProps> {
  static propTypes = {
    value: PropTypes.any
  };

  render(): JSX.Element {
    return <SyntaxHighlight code={inspect(this.props.value)} />;
  }
}
