import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import Syntax from '@leafygreen-ui/syntax';

const styles = require('./syntax-highlight.less');

interface SyntaxHighlightProps {
  code: string;
}

export class SyntaxHighlight extends Component<SyntaxHighlightProps> {
  static propTypes = {
    code: PropTypes.string.isRequired
  };

  render(): JSX.Element {
    return (<div className={classnames(styles['syntax-highlight'])}>
      <pre><Syntax language="javascript" variant="dark">{this.props.code}</Syntax></pre>
    </div>);
  }
}


