import React, { Component } from 'react';
import PropTypes from 'prop-types';
import AceEditor from 'react-ace';
import ace from 'brace';
import { QueryAutoCompleter } from 'mongodb-ace-autocompleter';
import classnames from 'classnames';
import { InfoSprinkle } from 'hadron-react-components';
import { shell } from 'electron';

import styles from './query-option.less';

import 'brace/ext/language_tools';
import 'mongodb-ace-mode';
import 'mongodb-ace-theme';

/**
 * Options for the ACE editor.
 */
const OPTIONS = {
  enableLiveAutocompletion: true,
  tabSize: 2,
  fontSize: 11,
  minLines: 1,
  maxLines: Infinity,
  showGutter: false,
  useWorker: false
};

class QueryOption extends Component {
  static displayName = 'QueryOption';

  static propTypes = {
    placeholder: PropTypes.string,
    label: PropTypes.string.isRequired,
    link: PropTypes.string.isRequired,
    inputType: PropTypes.oneOf(['numeric', 'boolean', 'document']).isRequired,
    value: PropTypes.any,
    autoPopulated: PropTypes.bool,
    hasToggle: PropTypes.bool,
    hasError: PropTypes.bool,
    validationFunc: PropTypes.func,
    onChange: PropTypes.func,
    schemaFields: PropTypes.object
  };

  static defaultProps = {
    placeholder: '',
    value: '',
    hasToggle: false,
    schemaFields: {}
  };

  /**
   * Set up the autocompleters once on initialization.
   *
   * @param {Object} props - The properties.
   */
  constructor(props) {
    super(props);
    const tools = ace.acequire('ace/ext/language_tools');
    const textCompleter = tools.textCompleter;
    this.completer = new QueryAutoCompleter('3.6.0', textCompleter, this.props.schemaFields);
    tools.setCompleters([ this.completer ]);
  }

  /**
   * Update the autocompleter fields and stage operator.
   *
   * @param {Object} nextProps - The new properties.
   */
  // componentWillReceiveProps(nextProps) {
    // this.completer.update(nextProps.schemaFields);
  // }

  onChangeQuery = (newCode) => {
    this.props.onChange({
      target: {
        value: newCode
      }
    });
  };

  _getInnerClassName() {
    const { label, inputType, hasToggle } = this.props;

    return classnames(
      styles.input,
      { [ styles[`input-${label}`] ]: label },
      { [ styles[`input-${inputType}`] ]: inputType },
      { [ styles['has-toggle'] ]: hasToggle }
    );
  }

  _renderCheckboxInput() {
    const { label, value, onChange } = this.props;

    return (
      <input
        id={`querybar-option-input-${label}`}
        data-test-id="query-bar-option-input"
        className={this._getInnerClassName()}
        type="checkbox"
        checked={value}
        onChange={onChange}
      />
    );
  }

  _renderAutoCompleteInput() {
    return (
      <AceEditor
        mode="mongodb"
        theme="mongodb"
        width="100%"
        value={this.props.value}
        onChange={this.onChangeQuery}
        editorProps={{ $blockScrolling: Infinity }}
        name={`query-bar-option-input-${this.props.label}`}
        setOptions={OPTIONS}
        onLoad={(editor) => {
          this.editor = editor;
        }} />
    );
  }

  _renderSimpleInput() {
    return (
      <input
        id={`querybar-option-input-${this.props.label}`}
        data-test-id="query-bar-option-input"
        className={this._getInnerClassName()}
        type="text"
        value={this.props.value}
        onChange={this.props.onChange}
        placeholder={this.props.placeholder}
      />
    );
  }

  render() {
    const { inputType, hasError, link, label } = this.props;
    let input = null;

    if ([ 'filter', 'project', 'sort' ].includes(label)) {
      input = this._renderAutoCompleteInput();
    } else if (this.props.inputType === 'boolean') {
      input = this._renderCheckboxInput();
    } else {
      input = this._renderSimpleInput();
    }

    const _className = classnames(
      styles.component,
      { [ styles[`is-${inputType}-type`] ]: true },
      { [ styles['has-error'] ]: hasError }
    );

    return (
      <div
        className={_className}
        data-test-id="query-bar-option">
        <div
          className={classnames(styles.label)}
          data-test-id="query-bar-option-label">
          <InfoSprinkle helpLink={link} onClickHandler={shell.openExternal} />
          {label}
        </div>
        {input}
      </div>
    );
  }
}

export default QueryOption;
export { QueryOption };
