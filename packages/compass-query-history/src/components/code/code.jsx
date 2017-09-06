import React, { PureComponent } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import highlight from 'highlight.js/lib/highlight';
import javascript from 'highlight.js/lib/languages/javascript';

import styles from './code.less';

class Code extends PureComponent {
  static displayName = 'Code';

  static propTypes = {
    code: PropTypes.string.isRequired,
    language: PropTypes.string.isRequired
  };

  static defaultProps = {};

  componentDidMount() {
    highlight.registerLanguage('javascript', javascript);
    this.highlightCode();
  }

  componentDidUpdate() {
    this.highlightCode();
  }

  highlightCode = () => {
    const node = ReactDOM.findDOMNode(this.refs.code);
    highlight.highlightBlock(node);
  };

  render() {
    const { language, code } = this.props;

    return (
      <pre className={classnames(styles.component)}>
        <code className={classnames(styles.code, language)} ref="code">
          {code}
        </code>
      </pre>
    );
  }
}

export default Code;
export { Code };
