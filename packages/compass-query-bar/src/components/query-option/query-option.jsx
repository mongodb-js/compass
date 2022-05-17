import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { InfoSprinkle } from 'hadron-react-components';
import OptionEditor from '../option-editor';

import styles from './query-option.module.less';

class QueryOption extends Component {
  static displayName = 'QueryOption';

  static propTypes = {
    placeholder: PropTypes.string,
    label: PropTypes.string.isRequired,
    serverVersion: PropTypes.string.isRequired,
    link: PropTypes.string.isRequired,
    actions: PropTypes.object.isRequired,
    inputType: PropTypes.oneOf(['numeric', 'boolean', 'document']).isRequired,
    value: PropTypes.any,
    autoPopulated: PropTypes.bool,
    hasToggle: PropTypes.bool,
    hasError: PropTypes.bool,
    validationFunc: PropTypes.func,
    onChange: PropTypes.func,
    onApply: PropTypes.func,
    schemaFields: PropTypes.array,
  };

  static defaultProps = {
    placeholder: '',
    value: '',
    hasToggle: false,
    schemaFields: [],
  };

  _getInnerClassName() {
    const { label, inputType, hasToggle } = this.props;

    return classnames(
      styles.input,
      { [styles[`input-${label}`]]: label },
      { [styles[`input-${inputType}`]]: inputType },
      { [styles['has-toggle']]: hasToggle }
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

  _openLink(href) {
    const userAgent = navigator.userAgent.toLowerCase();

    if (userAgent.indexOf('electron') > -1) {
      const { shell } = require('electron');

      shell.openExternal(href);
    } else {
      window.open(href, '_new');
    }
  }

  _renderAutoCompleteInput() {
    return (
      <OptionEditor
        label={this.props.label}
        value={this.props.value}
        serverVersion={this.props.serverVersion}
        onChange={this.props.onChange}
        onApply={this.props.onApply}
        autoPopulated={this.props.autoPopulated}
        actions={this.props.actions}
        schemaFields={this.props.schemaFields}
        placeholder={this.props.placeholder}
      />
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
    const { inputType, hasError, link, label, hasToggle } = this.props;
    let input = null;

    if (['filter', 'project', 'sort', 'collation'].includes(label)) {
      input = this._renderAutoCompleteInput();
    } else if (this.props.inputType === 'boolean') {
      input = this._renderCheckboxInput();
    } else {
      input = this._renderSimpleInput();
    }

    const _className = classnames(
      styles.component,
      { [styles[`is-${inputType}-type`]]: true },
      { [styles['has-error']]: hasError },
      { [styles['has-toggle']]: hasToggle }
    );

    return (
      <div className={_className} data-test-id="query-bar-option">
        <div className={styles.label} data-test-id="query-bar-option-label">
          <InfoSprinkle helpLink={link} onClickHandler={this._openLink} />
          {label}
        </div>
        {input}
      </div>
    );
  }
}

export default QueryOption;
export { QueryOption };
