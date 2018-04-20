import { TextButton } from 'hadron-react-buttons';
import { Modal, Alert } from 'react-bootstrap';
import React, { Component } from 'react';
import Select from 'react-select-plus';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import AceEditor from 'react-ace';

import 'brace/mode/javascript';
import 'mongodb-ace-theme';

import styles from './export-modal.less';

const OPTIONS = {
  tabSize: 2,
  fontSize: 11,
  minLines: 5,
  maxLines: Infinity,
  showGutter: true,
  readOnly: false,
  highlightActiveLine: false,
  highlightGutterLine: false,
  useWorker: false
};

class ExportModal extends Component {
  static displayName = 'ExportModalComponent';

  static propTypes = {
    copyQuery: PropTypes.func.isRequired,
    exportQuery: PropTypes.object.isRequired,
    runQuery: PropTypes.func.isRequired
  }

  // store the current query in state before we pass it to reducer
  state = {
    queryInputValue: '',
    outputLang: ''
  }

  queryInputEvent = (value) => {
    this.setState({
      queryInputValue: value
    });
  }

  // save state, and pass in the current selected lang
  handleOutputSelect = (outputLang) => {
    this.setState({ outputLang });
    this.props.runQuery(outputLang.value, this.state.queryInputValue);
  }

  copyHandler = (evt) => {
    evt.preventDefault();
    const input = document.getElementById('export-to-lang-form-output-return');
    this.props.copyQuery(input);
  }

  /**
   * Render the save pipeline component.
   *
   * @returns {Component} The component.
   */
  render() {
    const langOuputOptions = [
      { value: 'java', label: 'Java' },
      { value: 'node', label: 'Node' },
      { value: 'csharp', label: 'C#' },
      { value: 'python3', label: 'Python 3' }
    ];

    const copyButtonStyle = classnames({
      'btn': true,
      'btn-sm': true,
      'btn-primary': true,
      [ styles['export-to-lang-form-output-copy-btn'] ]: true
    });

    const queryStyle = this.props.exportQuery.queryError
      ? classnames(styles['export-to-lang-form-query-error'])
      : classnames(styles['export-to-lang-form-query']);

    const outputLang = this.state.outputLang;
    const selectedOutputValue = outputLang && outputLang.value;

    const errorDiv = this.props.exportQuery.queryError
      ? <Alert bsStyle="danger" className={classnames(styles['export-to-lang-form-error'])} children={this.props.exportQuery.queryError}/>
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
          <form name="export-to-lang-form"
              data-test-id="export-to-lang">
            <div className="form-group">
              <Alert
                className={classnames(styles['export-to-lang-form-alert'])}
                children="PROJECT, SORT, SKIP, LIMIT options are not included as part of the exported query."/>
              <p>My Query</p>
              <div className={queryStyle}>
                <AceEditor
                  mode="javascript"
                  className="export-to-lang-form-query-input"
                  theme="mongodb"
                  value={this.state.queryInputValue}
                  onChange={this.queryInputEvent}
                  width="100%"
                  editorProps={{$blockScrolling: Infinity}}
                  setOptions={OPTIONS}/>
              </div>
              {errorDiv}
            </div>
            <div>
              <p>Export Query To</p>
              <div className={classnames(styles['export-to-lang-form-output'])}>
                <Select
                  name="export-to-lang-form-output-select"
                  className={classnames(styles['export-to-lang-form-output-select'])}
                  searchable={false}
                  clearable={false}
                  placeholder="Java"
                  value={selectedOutputValue}
                  onChange={this.handleOutputSelect}
                  options={langOuputOptions}/>
                <input
                  type="text"
                  className={classnames(styles['export-to-lang-form-output-return'])}
                  id="export-to-lang-form-output-return"
                  value={this.props.exportQuery.returnQuery}/>
                <TextButton
                  className={copyButtonStyle}
                  text="Copy"
                  clickHandler={this.copyHandler}/>
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
