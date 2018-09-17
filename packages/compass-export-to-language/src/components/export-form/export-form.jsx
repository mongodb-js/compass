import { IconTextButton } from 'hadron-react-buttons';
import SelectLang from 'components/select-lang';
import React, { Component } from 'react';
import { Alert } from 'react-bootstrap';
import Editor from 'components/editor';
import classnames from 'classnames';
import PropTypes from 'prop-types';

import styles from './export-form.less';

class ExportForm extends Component {
  static displayName = 'ExportFormComponent';

  static propTypes = {
    exportQuery: PropTypes.object.isRequired,
    setOutputLang: PropTypes.func.isRequired,
    copyQuery: PropTypes.func.isRequired,
    clearCopy: PropTypes.func.isRequired,
    runQuery: PropTypes.func.isRequired
  };

  copyOutputHandler = (evt) => {
    evt.preventDefault();
    this.props.copyQuery({ query: this.props.exportQuery.returnQuery, type: 'output' });
    setTimeout(() => { this.props.clearCopy(); }, 2500);
  };

  copyInputHandler = (evt) => {
    evt.preventDefault();
    this.props.copyQuery({ query: this.props.exportQuery.inputQuery, type: 'input'});
    setTimeout(() => { this.props.clearCopy(); }, 2500);
  };

  render() {
    const copyOutputButtonStyle = classnames({
      [ styles['export-to-lang-query-output-copy'] ]: true,
      'btn-sm': true,
      'btn-primary': true,
      'btn': true
    });
    const copyInputButtonStyle = classnames({
      [ styles['export-to-lang-query-input-copy'] ]: true,
      'btn-sm': true,
      'btn-primary': true,
      'btn': true
    });

    const errorDiv = this.props.exportQuery.queryError
      ? <Alert bsStyle="danger" className={classnames(styles['export-to-lang-query-input-error'])} children={this.props.exportQuery.queryError}/>
      : '';

    const outputBubbleDiv = this.props.exportQuery.copySuccess === 'output'
      ? <div className={classnames(styles['export-to-lang-query-output-bubble'])}>Copied!</div>
      : '';

    const inputBubbleDiv = this.props.exportQuery.copySuccess === 'input'
      ? <div className={classnames(styles['export-to-lang-query-input-bubble'])}>Copied!</div>
      : '';

    return (
      <form name="export-to-lang" data-test-id="export-to-lang" className="export-to-lang">
        <div className={classnames(styles['export-to-lang-headers'])}>
          <p className={classnames(styles['export-to-lang-headers-input'])}>
            {`My ${this.props.exportQuery.namespace}:`}
          </p>
          <div className={classnames(styles['export-to-lang-headers-output'])}>
            <p className={classnames(styles['export-to-lang-headers-output-title'])}>
              {`Export ${this.props.exportQuery.namespace} To:`}
            </p>
            <SelectLang
              outputLang={this.props.exportQuery.outputLang}
              inputQuery={this.props.exportQuery.inputQuery}
              setOutputLang={this.props.setOutputLang}
              runQuery={this.props.runQuery}/>
          </div>
        </div>
        <div className={classnames(styles['export-to-lang-query'])}>
          <div className={classnames(styles['export-to-lang-query-input'])}>
            <Editor
              outputQuery={this.props.exportQuery.returnQuery}
              queryError={this.props.exportQuery.queryError}
              outputLang={this.props.exportQuery.outputLang}
              inputQuery={this.props.exportQuery.inputQuery}
              showImports={this.props.exportQuery.showImports}
              imports={this.props.exportQuery.imports}
              input/>
            {inputBubbleDiv}
            <div className={classnames(styles['export-to-lang-copy-input-container'])}>
              <IconTextButton
                clickHandler={this.copyInputHandler}
                className={copyInputButtonStyle}
                iconClassName="fa fa-copy"/>
            </div>
          </div>
          <div className={classnames(styles['export-to-lang-query-output'])}>
            <Editor
              outputQuery={this.props.exportQuery.returnQuery}
              queryError={this.props.exportQuery.queryError}
              outputLang={this.props.exportQuery.outputLang}
              inputQuery={this.props.exportQuery.inputQuery}
              showImports={this.props.exportQuery.showImports}
              imports={this.props.exportQuery.imports}/>
            {outputBubbleDiv}
            <div className={classnames(styles['export-to-lang-copy-output-container'])}>
              <IconTextButton
                clickHandler={this.copyOutputHandler}
                className={copyOutputButtonStyle}
                iconClassName="fa fa-copy"/>
            </div>
          </div>
        </div>
        {errorDiv}
      </form>
    );
  }
}

export default ExportForm;
