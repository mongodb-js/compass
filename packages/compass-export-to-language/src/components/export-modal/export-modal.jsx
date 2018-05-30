import { TextButton } from 'hadron-react-buttons';
import SelectLang from 'components/select-lang';
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
  focus: false,
  readOnly: true,
  highlightActiveLine: false,
  highlightGutterLine: false,
  useWorker: false
};

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
    outputLang: ''
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

    const copyButtonStyle = classnames({
      'btn': true,
      'btn-sm': true,
      'btn-default': true,
      [ styles['export-to-lang-form-query-output-editor-copy'] ]: true
    });

    const queryStyle = this.props.exportQuery.queryError
      ? classnames(styles['export-to-lang-form-query-error'])
      : classnames(styles['export-to-lang-form-query-input-editor']);

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
              data-test-id="export-to-lang"
              className="export-to-lang-form"
            >
            <div className="form-group">
              <Alert
                className={classnames(styles['export-to-lang-form-alert'])}
                children="PROJECT, SORT, SKIP, LIMIT options are not included as part of the exported query."/>
            </div>
            <div className={classnames(styles['export-to-lang-form-query'])}>
              <div className={classnames(styles['export-to-lang-form-query-input'])}>
                <p>My Query</p>
                <div className={queryStyle}>
                  <AceEditor
                    mode="javascript"
                    theme="mongodb"
                    value={this.props.inputQuery}
                    width="100%"
                    editorProps={{$blockScrolling: Infinity}}
                    setOptions={OPTIONS}/>
                </div>
                {errorDiv}
              </div>
              <div className={classnames(styles['export-to-lang-form-query-output'])}>
                <div className={classnames(styles['export-to-lang-form-query-output-export'])}>
                  <p className={classnames(styles['export-to-lang-form-query-output-export-text'])}>Export Query To</p>
                  <Select
                    name="export-to-lang-form-query-output-select"
                    className={classnames(styles['export-to-lang-form-query-output-export-select'])}
                    searchable={false}
                    clearable={false}
                    placeholder="Java"
                    value={selectedOutputValue}
                    onChange={this.handleOutputSelect}
                    options={langOuputOptions}/>
                </div>
                <div className={classnames(styles['export-to-lang-form-query-output-editor'])}>
                  <AceEditor
                    mode="javascript"
                    theme="mongodb"
                    id="export-to-lang-output"
                    value={this.props.exportQuery.returnQuery}
                    width="100%"
                    editorProps={{$blockScrolling: Infinity}}
                    setOptions={OPTIONS}/>
                  <TextButton
                    className={copyButtonStyle}
                    text="Copy"
                    clickHandler={this.copyHandler}/>
                </div> 
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
