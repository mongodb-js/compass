import React, { PureComponent } from 'react';
import Select from 'react-select-plus';
import classnames from 'classnames';
import PropTypes from 'prop-types';

import styles from './select-lang.less';

class SelectLang extends PureComponent {
  static displayName = 'SelectLangComponent';

  static propTypes = {
    setOutputLang: PropTypes.func.isRequired,
    inputQuery: PropTypes.string.isRequired,
    outputLang: PropTypes.string.isRequired,
    runQuery: PropTypes.func.isRequired
  }

  // save state, and pass in the currently selected lang
  handleOutputSelect = (outputLang) => {
    this.props.setOutputLang(outputLang.value);
    this.props.runQuery(outputLang.value, this.props.inputQuery);
  }

  render() {
    const selectedOutputValue = this.props.outputLang || '';

    const langOuputOptions = [
      { value: 'java', label: 'Java' },
      { value: 'javascript', label: 'Node' },
      { value: 'csharp', label: 'C#' },
      { value: 'python', label: 'Python 3' }
    ];

    return (
      <Select
        name="select-lang"
        className={classnames(styles['select-lang'])}
        searchable={false}
        clearable={false}
        placeholder="Java"
        value={selectedOutputValue}
        onChange={this.handleOutputSelect}
        options={langOuputOptions}/>
    );
  }
}

export default SelectLang;
