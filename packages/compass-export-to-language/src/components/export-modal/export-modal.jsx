import { TextButton } from 'hadron-react-buttons';
import { Modal, Alert } from 'react-bootstrap';
import React, { Component } from 'react';
import Select from 'react-select-plus';
import Editor from 'components/editor';
import classnames from 'classnames';
import PropTypes from 'prop-types';

import styles from './export-modal.less';

class ExportModal extends Component {
  static displayName = 'ExportModalComponent';

  static propTypes = {
    exportQuery: PropTypes.object.isRequired,
    inputQuery: PropTypes.string.isRequired,
    copyQuery: PropTypes.func.isRequired,
    runQuery: PropTypes.func.isRequired
  }

  // store the current query in state before we pass it to reducer
  state = {
    outputLang: {
      value: '',
      label: ''
    }
  }

  // save state, and pass in the currently selected lang
  handleOutputSelect = (outputLang) => {
    this.setState({ outputLang });
    this.props.runQuery(outputLang.value, this.props.inputQuery);
  }

  copyHandler = (evt) => {
    evt.preventDefault();
    this.props.copyQuery(this.props.exportQuery.returnQuery);
  }

  render() {
    const langOuputOptions = [
      { value: 'java', label: 'Java' },
      { value: 'javascript', label: 'Node' },
      { value: 'csharp', label: 'C#' },
      { value: 'python', label: 'Python 3' }
    ];

    // const copyButtonStyle = classnames({
    //   'btn': true,
    //   'btn-sm': true,
    //   'btn-default': true,
    //   [ styles['export-to-lang-form-query-output-editor-copy'] ]: true
    // });

    const outputLang = this.state.outputLang;
    const selectedOutputValue = outputLang && outputLang.value;

    const errorDiv = this.props.exportQuery.queryError
      ? <Alert bsStyle="danger" className={classnames(styles['export-to-lang-form-query-input-error'])} children={this.props.exportQuery.queryError}/>
      : '';

    return (
      <Modal
        show
        backdrop="static"
        bsSize="large"
        onHide={this.onExportModalToggle}
        dialogClassName="export-to-lang-modal">

        <Modal.Header>
          <Modal.Title>Export Query To Language</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <form name="export-to-lang-form" data-test-id="export-to-lang" className="export-to-lang-form">
            <div className="form-group">
              <Alert
                className={classnames(styles['export-to-lang-form-alert'])}
                children="PROJECT, SORT, SKIP, LIMIT options are not included as part of the exported query."/>
            </div>
            <div className={classnames(styles['export-to-lang-form-headers'])}>
              <p className={classnames(styles['export-tolang-form-headers-input'])}>My Query</p>
              <div className={classnames(styles['export-to-lang-form-headers-output'])}>
                <p className={classnames(styles['export-to-lang-form-headers-output-title'])}>Export Query To:</p>
                <Select
                  name="export-to-lang-form-query-output-select"
                  className={classnames(styles['export-to-lang-form-headers-output-select'])}
                  searchable={false}
                  clearable={false}
                  placeholder="Java"
                  value={selectedOutputValue}
                  onChange={this.handleOutputSelect}
                  options={langOuputOptions}/>
              </div>
            </div>
            <div className={classnames(styles['export-to-lang-form-query'])}>
              <div className={classnames(styles['export-to-lang-form-query-input'])}>
                <Editor outputQuery={this.props.exportQuery.returnQuery} queryError={this.props.exportQuery.queryError} outputLang={this.state.outputLang.value} inputQuery={this.props.inputQuery} input/>
                {errorDiv}
              </div>
              <div className={classnames(styles['export-to-lang-form-query-output'])}>
                <Editor outputQuery={this.props.exportQuery.returnQuery} queryError={this.props.exportQuery.queryError} outputLang={this.state.outputLang.value} inputQuery={this.props.inputQuery}/>
              </div>
            </div>
          </form>
        </Modal.Body>

        <Modal.Footer>
          <TextButton
            className="btn btn-default btn-sm"
            text="Close"
            clickHandler={()=>{}} />
        </Modal.Footer>
      </Modal>
    );
  }
}

export default ExportModal;
