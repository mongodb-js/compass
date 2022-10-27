import { IconTextButton } from 'hadron-react-buttons';
import SelectLang from '../select-lang';
import React, { PureComponent } from 'react';
import { Alert } from 'react-bootstrap';
import Editor from '../editor';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import jsBeautify from 'js-beautify';

import styles from './export-form.module.less';

class ExportForm extends PureComponent {
  static displayName = 'ExportFormComponent';

  static propTypes = {
    copySuccess: PropTypes.string,
    copyToClipboard: PropTypes.func.isRequired,
    imports: PropTypes.string.isRequired,
    showImports: PropTypes.bool.isRequired,
    inputExpression: PropTypes.object.isRequired,
    transpiledExpression: PropTypes.string.isRequired,
    mode: PropTypes.string.isRequired,
    outputLang: PropTypes.string.isRequired,
    error: PropTypes.string,
    from: PropTypes.string.isRequired,
    outputLangChanged: PropTypes.func.isRequired,
    copySuccessChanged: PropTypes.func.isRequired,
    runTranspiler: PropTypes.func.isRequired,
  };

  getInput() {
    if (this.props.from !== '') {
      return jsBeautify(this.props.from, null, 2);
    }

    return '';
  }

  getOutput() {
    const { showImports, imports, transpiledExpression, error } = this.props;
    if (error) {
      return '';
    }
    return showImports && imports !== ''
      ? `${imports}\n\n${this.props.transpiledExpression}`
      : transpiledExpression;
  }

  copyOutputHandler = (evt) => {
    evt.preventDefault();
    this.props.copyToClipboard(this.getOutput());
    this.props.copySuccessChanged('output');
    setTimeout(() => {
      this.props.copySuccessChanged(null);
    }, 2500);
  };

  copyInputHandler = (evt) => {
    evt.preventDefault();
    this.props.copyToClipboard(this.props.from);
    this.props.copySuccessChanged('input');
    setTimeout(() => {
      this.props.copySuccessChanged(null);
    }, 2500);
  };

  render() {
    const copyOutputButtonStyle = classnames({
      [styles['export-to-lang-query-output-copy']]: true,
      'btn-sm': true,
      'btn-primary': true,
      btn: true,
    });
    const copyInputButtonStyle = classnames({
      [styles['export-to-lang-query-input-copy']]: true,
      'btn-sm': true,
      'btn-primary': true,
      btn: true,
    });

    const errorDiv = this.props.error ? (
      <Alert
        bsStyle="danger"
        className={classnames(styles['export-to-lang-query-input-error'])}
      >
        {this.props.error}
      </Alert>
    ) : (
      ''
    );

    const outputBubbleDiv =
      this.props.copySuccess === 'output' ? (
        <div
          className={classnames(styles['export-to-lang-query-output-bubble'])}
        >
          Copied!
        </div>
      ) : (
        ''
      );

    const inputBubbleDiv =
      this.props.copySuccess === 'input' ? (
        <div
          className={classnames(styles['export-to-lang-query-input-bubble'])}
        >
          Copied!
        </div>
      ) : (
        ''
      );

    return (
      <form
        name="export-to-lang"
        data-testid="export-to-lang"
        className="export-to-lang"
      >
        <div className={classnames(styles['export-to-lang-headers'])}>
          <p className={classnames(styles['export-to-lang-headers-input'])}>
            {`My ${this.props.mode}:`}
          </p>
          <div
            className={classnames(styles['export-to-lang-headers-output'])}
            data-testid="select-lang-field"
          >
            <p
              className={classnames(
                styles['export-to-lang-headers-output-title']
              )}
            >
              {`Export ${this.props.mode} To:`}
            </p>
            <SelectLang {...this.props} />
          </div>
        </div>
        <div className={classnames(styles['export-to-lang-query'])}>
          <div className={classnames(styles['export-to-lang-query-input'])}>
            <Editor value={this.getInput()} />
            {inputBubbleDiv}
            <div
              className={classnames(
                styles['export-to-lang-copy-input-container']
              )}
            >
              <IconTextButton
                dataTestId="export-to-lang-copy-input"
                clickHandler={this.copyInputHandler}
                className={copyInputButtonStyle}
                iconClassName="fa fa-copy"
              />
            </div>
          </div>
          <div
            data-testid="export-to-lang-query-output-container"
            className={classnames(styles['export-to-lang-query-output'])}
          >
            <Editor language={this.props.outputLang} value={this.getOutput()} />
            {outputBubbleDiv}
            <div
              className={classnames(
                styles['export-to-lang-copy-output-container']
              )}
            >
              <IconTextButton
                dataTestId="export-to-lang-copy-output"
                clickHandler={this.copyOutputHandler}
                className={copyOutputButtonStyle}
                iconClassName="fa fa-copy"
              />
            </div>
          </div>
        </div>
        {errorDiv}
      </form>
    );
  }
}

export default ExportForm;
