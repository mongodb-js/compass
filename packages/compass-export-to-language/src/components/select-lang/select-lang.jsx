import React, { PureComponent } from 'react';
import Select from 'react-select-plus';
import classnames from 'classnames';
import PropTypes from 'prop-types';

import styles from './select-lang.module.less';

class SelectLang extends PureComponent {
  static displayName = 'SelectLangComponent';

  // input query can be an object(empty query) or a string(an actual query) so
  // check for any
  static propTypes = {
    outputLangChanged: PropTypes.func.isRequired,
    inputExpression: PropTypes.object.isRequired,
    outputLang: PropTypes.string.isRequired,
    runTranspiler: PropTypes.func.isRequired
  }

  // save state, and pass in the currently selected lang
  handleOutputSelect = (outputLang) => {
    this.props.outputLangChanged(outputLang.value);
    this.props.runTranspiler(this.props.inputExpression);
  }

  render() {
    const selectedOutputValue = this.props.outputLang || '';

    const langOuputOptions = [
      { value: 'java', label: 'Java' },
      { value: 'javascript', label: 'Node' },
      { value: 'csharp', label: 'C#' },
      { value: 'python', label: 'Python 3' },
      { value: 'ruby', label: 'Ruby' },
      { value: 'go', label: 'Go'},
      { value: 'rust', label: 'Rust' }
    ];

    return (
      <Select
        name="select-lang"
        className={classnames(styles['select-lang'])}
        searchable={false}
        clearable={false}
        placeholder="Python"
        value={selectedOutputValue}
        onChange={this.handleOutputSelect}
        options={langOuputOptions}/>
    );
  }
}

export default SelectLang;
