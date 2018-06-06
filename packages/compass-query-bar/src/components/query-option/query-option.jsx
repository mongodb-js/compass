import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { InfoSprinkle } from 'hadron-react-components';
import { shell } from 'electron';
import OptionEditor from 'components/option-editor';

import styles from './query-option.less';

class QueryOption extends Component {
  static displayName = 'QueryOption';

  static propTypes = {
    placeholder: PropTypes.string,
    label: PropTypes.string.isRequired,
    link: PropTypes.string.isRequired,
    actions: PropTypes.object.isRequired,
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
      <OptionEditor
        label={this.props.label}
        value={this.props.value}
        onChange={this.props.onChange}
        autoPopulated={this.props.autoPopulated}
        actions={this.props.actions}
        schemaFields={this.props.schemaFields} />
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
