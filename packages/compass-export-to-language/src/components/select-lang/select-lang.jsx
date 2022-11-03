import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { css, Option, Select, spacing } from '@mongodb-js/compass-components';

const selectStyles = css({
  width: spacing[7] * 2,
  marginTop: spacing[2],
});

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
    this.props.outputLangChanged(outputLang);
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
      { value: 'rust', label: 'Rust' },
      { value: 'php', label: 'PHP' }
    ];

    return (
      <Select
        aria-label={'Select a language'}
        allowDeselect={false}
        placeholder={'Select a language'}
        className={selectStyles}
        size="small"
        data-testid="export-to-language-select-lang"
        onChange={this.handleOutputSelect}
        value={selectedOutputValue}
        clearable={false}
        name="select-lang"
        popoverZIndex={9999}
      >
        {langOuputOptions.map((option) => (
          <Option
            key={option.value}
            value={option.value}
            data-testid={`export-to-language-select-lang-${option.value}`}>
            {option.label}
          </Option>
        ))}
      </Select>
    );
  }
}

export default SelectLang;
